"""
filters.py — Speckle Filters for SAR Imagery (Earth Engine)
=============================================================

Implements the **Refined Lee** speckle filter entirely as server-side
``ee.Image`` operations so that the computation runs on Google's
infrastructure and scales to arbitrary image sizes.

Why Refined Lee instead of focal_mean()?
-----------------------------------------
``ee.Image.focal_mean()`` (a.k.a. box / mean filter) computes the
arithmetic mean in a fixed square window.  While it reduces speckle
variance, it does so **indiscriminately** — edges, linear features,
and point scatterers are blurred just as much as homogeneous areas.
This is catastrophic for flood mapping because the very boundaries
we need to delineate (water ↔ land) are exactly the edges that a
mean filter destroys.

The **Refined Lee filter** (Lee 1981, refined by Lee et al. 1999)
solves this by:

1.  **Directional statistics**: computing local mean and variance in
    multiple oriented sub-windows (4 cardinal + 4 diagonal directions
    within a 7 × 7 neighbourhood).
2.  **Edge-direction selection**: choosing the sub-window whose
    variance is *lowest* — i.e. the direction along which the local
    neighbourhood is most *homogeneous* — thus aligning the filter
    kernel parallel to any edge.
3.  **Adaptive weighting**: applying the standard Lee MMSE (Minimum
    Mean Square Error) formula using the selected directional
    statistics:

    .. math::

        \\hat{I} = \\bar{I}_d + K \\cdot (I - \\bar{I}_d)

    where

    .. math::

        K = 1 - \\frac{C_u^2}{C_{I_d}^2}

    and :math:`C_u` is the coefficient of variation of uniform
    speckle (determined by the number of looks), :math:`C_{I_d}` is
    the coefficient of variation in the selected directional window,
    and :math:`K` is clamped to ``[0, 1]``.

The result preserves edges almost perfectly while suppressing speckle
in homogeneous regions — exactly what we need for thresholding-based
flood detection.

Mathematical Symbols
--------------------
- :math:`I`          — observed (speckled) pixel intensity
- :math:`\\bar{I}_d` — local mean in the selected directional window
- :math:`\\sigma_d^2` — local variance in the selected directional window
- :math:`C_u`        — noise coefficient of variation = :math:`1/\\sqrt{\\text{ENL}}`
- :math:`C_{I_d}`    — local coefficient of variation = :math:`\\sigma_d / \\bar{I}_d`
- :math:`K`          — adaptive weight = :math:`\\max(0, 1 - C_u^2 / C_{I_d}^2)`
- :math:`\\hat{I}`   — filtered (despeckled) pixel intensity

References
----------
- Lee, J.-S. (1981). "Speckle analysis and smoothing of synthetic
  aperture radar images." *Computer Graphics and Image Processing*,
  17(1), 24–32.
- Lee, J.-S., Grunes, M. R., & de Grandi, G. (1999). "Polarimetric
  SAR speckle filtering and its implication for classification."
  *IEEE TGRS*, 37(5), 2363–2373.
"""

from __future__ import annotations

import ee

from FloodDetectionEngine.utils.logger import get_logger

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Directional kernel definitions
# ---------------------------------------------------------------------------
#
# Within a 7 × 7 neighbourhood we define 4 pairs of directed windows
# (each pair covers opposite directions — combined they form the full
# line).  The 8 directions are:  horizontal, vertical, 45° diagonal,
# 135° diagonal, and their reverses (which share the same statistics
# because variance is symmetric).
#
# Each kernel is a 7 × 7 list-of-lists with 1 = inside, 0 = outside.

def _make_directional_kernels() -> list[ee.Kernel]:
    """
    Build eight 7 × 7 directional weight kernels.

    Returns
    -------
    list[ee.Kernel]
        Eight ``ee.Kernel.fixed`` objects, one per direction.
    """
    # Horizontal (left half of row)
    h1 = [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 0, 0, 0],
        [1, 1, 1, 1, 0, 0, 0],
        [1, 1, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
    ]
    # Horizontal (right half of row)
    h2 = [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 1],
        [0, 0, 0, 1, 1, 1, 1],
        [0, 0, 0, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
    ]
    # Vertical (top half)
    v1 = [
        [0, 0, 1, 1, 1, 0, 0],
        [0, 0, 1, 1, 1, 0, 0],
        [0, 0, 1, 1, 1, 0, 0],
        [0, 0, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
    ]
    # Vertical (bottom half)
    v2 = [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 0, 0],
        [0, 0, 1, 1, 1, 0, 0],
        [0, 0, 1, 1, 1, 0, 0],
        [0, 0, 1, 1, 1, 0, 0],
    ]
    # Diagonal 45° (upper-right)
    d45_1 = [
        [0, 0, 0, 0, 1, 1, 1],
        [0, 0, 0, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 0, 0],
        [0, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
    ]
    # Diagonal 45° (lower-left)
    d45_2 = [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 0, 0],
        [0, 0, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 0, 0, 0],
        [1, 1, 1, 0, 0, 0, 0],
    ]
    # Diagonal 135° (upper-left)
    d135_1 = [
        [1, 1, 1, 0, 0, 0, 0],
        [0, 1, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
    ]
    # Diagonal 135° (lower-right)
    d135_2 = [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 1, 1, 0],
        [0, 0, 0, 0, 1, 1, 1],
    ]

    raw_kernels = [h1, h2, v1, v2, d45_1, d45_2, d135_1, d135_2]
    ee_kernels = []
    for k in raw_kernels:
        grid = [[float(val) for val in row] for row in k]
        ee_kernels.append(ee.Kernel.fixed(7, 7, grid, 3, 3, False))
    return ee_kernels


def refined_lee_filter(
    image: ee.Image,
    enl: float = 4.4,
) -> ee.Image:
    """
    Apply the Refined Lee speckle filter to a single-band SAR image.

    The image **must be in natural (linear power) scale**, not dB.
    If your image is in dB, convert first::

        linear = ee.Image(10).pow(db_image.divide(10))
        filtered = refined_lee_filter(linear)
        back_to_db = filtered.log10().multiply(10)

    Parameters
    ----------
    image : ee.Image
        Single-band SAR intensity image in **linear** scale.
    enl : float
        Equivalent Number of Looks.  For Sentinel-1 IW GRD the ENL
        is approximately 4.4 (Copernicus documentation).

    Returns
    -------
    ee.Image
        Despeckled image (same band name, linear scale).

    Algorithm
    ---------
    1. Compute noise coefficient of variation:
       ``Cu = 1 / sqrt(ENL)``
    2. For each of 8 directional kernels compute the local mean and
       variance using ``reduceNeighborhood``.
    3. Compute the coefficient of variation for each direction:
       ``Ci = sqrt(variance) / mean``
    4. Select the direction with the **minimum** Ci (most
       homogeneous).
    5. Retrieve the mean and variance associated with that direction.
    6. Compute the adaptive weight:
       ``K = max(0, 1 − Cu² / Ci²)``
    7. Output:
       ``filtered = mean_selected + K * (original − mean_selected)``
    """
    logger.info("Applying Refined Lee speckle filter (ENL=%.1f).", enl)

    band_name = image.bandNames().get(0)
    img = image.select([band_name])

    # Step 1: noise coefficient of variation
    cu = 1.0 / (enl ** 0.5)
    cu2 = cu * cu  # Cu²

    # Step 2: directional statistics
    kernels = _make_directional_kernels()

    means: list[ee.Image] = []
    variances: list[ee.Image] = []

    for i, kernel in enumerate(kernels):
        local_mean = img.reduceNeighborhood(
            reducer=ee.Reducer.mean(),
            kernel=kernel,
        )
        local_variance = img.reduceNeighborhood(
            reducer=ee.Reducer.variance(),
            kernel=kernel,
        )
        means.append(local_mean)
        variances.append(local_variance)

    # Step 3: coefficient of variation per direction
    # Ci² = variance / mean²   (avoids sqrt for comparison purposes)
    ci2_images = []
    for m, v in zip(means, variances):
        # Guard against division by zero (mean == 0 in shadow areas)
        safe_mean = m.max(ee.Image(1e-10))
        ci2 = v.divide(safe_mean.pow(2))
        ci2_images.append(ci2)

    # Step 4: find direction index with minimum Ci²
    # Stack into a multi-band image, then use argmin via reduce
    ci2_stack = ee.Image.cat(ci2_images)
    # Rename bands to numeric indices for clarity
    ci2_stack = ci2_stack.rename([f"dir_{i}" for i in range(len(ci2_images))])

    # Use arrayReduce approach:
    # Convert to array image, find argmin, then use it to index means/variances
    ci2_array = ci2_stack.toArray()
    min_index = ci2_array.multiply(-1).arrayArgmax().arrayGet([0])  # index of smallest Ci² via argmax(-x)

    # Step 5: retrieve mean and variance for the selected direction
    mean_stack = ee.Image.cat(means).rename([f"dir_{i}" for i in range(len(means))])
    var_stack = ee.Image.cat(variances).rename([f"dir_{i}" for i in range(len(variances))])

    mean_array = mean_stack.toArray()
    var_array = var_stack.toArray()

    # Index into the arrays using min_index
    selected_mean = mean_array.arrayGet(min_index)
    selected_var = var_array.arrayGet(min_index)

    # Step 6: adaptive weight K = max(0, 1 − Cu² / Ci²_selected)
    safe_selected_mean = selected_mean.max(ee.Image(1e-10))
    selected_ci2 = selected_var.divide(safe_selected_mean.pow(2))
    # K = 1 − Cu²/Ci²   (clamped to [0, 1])
    k_weight = (
        ee.Image(1.0)
        .subtract(ee.Image(cu2).divide(selected_ci2.max(ee.Image(1e-10))))
        .max(ee.Image(0.0))
        .min(ee.Image(1.0))
    )

    # Step 7: filtered = mean + K * (original − mean)
    filtered = selected_mean.add(k_weight.multiply(img.subtract(selected_mean)))
    filtered = filtered.rename([band_name])

    logger.info("Refined Lee filter applied successfully.")
    return filtered
