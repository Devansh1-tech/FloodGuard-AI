"""
otsu.py — Automatic Otsu Thresholding on Earth Engine Images
==============================================================

Implements **Otsu's method** (Otsu, 1979) entirely server-side using
``ee.Reducer.histogram`` and ``ee.Array`` operations.  No manual
threshold is ever set — the optimal split point is computed from the
image histogram automatically.

Otsu's Algorithm
----------------
Given a grayscale image histogram, Otsu's method finds the threshold
:math:`t^*` that **maximises the between-class variance**
:math:`\\sigma_B^2(t)`:

.. math::

    t^* = \\arg\\max_t \\; \\sigma_B^2(t)

where

.. math::

    \\sigma_B^2(t) = \\omega_0(t) \\cdot \\omega_1(t) \\cdot
                     [\\mu_0(t) - \\mu_1(t)]^2

and

- :math:`\\omega_0(t) = \\sum_{i=0}^{t} p_i` — weight of class 0
  (background)
- :math:`\\omega_1(t) = 1 - \\omega_0(t)` — weight of class 1 (flood)
- :math:`\\mu_0(t) = \\frac{1}{\\omega_0} \\sum_{i=0}^{t} i \\cdot p_i`
  — mean of class 0
- :math:`\\mu_1(t) = \\frac{1}{\\omega_1} \\sum_{i=t+1}^{L-1} i \\cdot p_i`
  — mean of class 1
- :math:`p_i` — probability of bin *i*

Maximising :math:`\\sigma_B^2` is equivalent to minimising the
*intra-class* variance and produces a threshold that best separates
the two modes of the histogram.

Why Otsu Works for Flood Detection
-----------------------------------
The log-ratio change image typically exhibits a **bimodal histogram**:

- A large peak centred near 0 representing *unchanged* pixels.
- A secondary peak in the positive tail representing *flooded* pixels
  (where backscatter dropped).

Otsu's method naturally finds the valley between these two peaks.

References
----------
- Otsu, N. (1979). "A threshold selection method from gray-level
  histograms." *IEEE Transactions on Systems, Man, and Cybernetics*,
  9(1), 62–66.
"""

from __future__ import annotations

import ee

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


def otsu_threshold(
    image: ee.Image,
    region: ee.Geometry,
    config: EngineConfig,
    band: str = "change",
) -> ee.Number:
    """
    Compute the Otsu threshold for *image* over *region*.

    The entire computation is **server-side** (``ee.Array`` / ``ee.Number``
    operations) so it scales to large images without downloading data.

    Parameters
    ----------
    image : ee.Image
        The change-detection image to threshold.
    region : ee.Geometry
        Region over which to compute the histogram.
    config : EngineConfig
        Engine configuration.  Relevant fields:

        - ``otsu_histogram_bins`` — number of histogram bins (default 256)
        - ``otsu_histogram_min`` — histogram lower bound
        - ``otsu_histogram_max`` — histogram upper bound
        - ``export_scale``       — scale in metres for the reduceRegion
    band : str
        Band name to threshold (default ``"change"``).

    Returns
    -------
    ee.Number
        Optimal threshold value (server-side).  Call ``.getInfo()``
        to materialise locally.

    Algorithm (server-side)
    -----------------------
    1.  Compute a fixed-range histogram via ``ee.Reducer.histogram``.
    2.  Extract bin centres (``bucketMeans``) and counts.
    3.  Normalise counts to probabilities.
    4.  Compute cumulative sums (ω₀, μ₀) and total mean (μ_T).
    5.  For every possible threshold *t*, compute σ²_B(t).
    6.  Return the bin centre that maximises σ²_B.
    """
    with LogTimer("Otsu threshold computation", logger):
        # Step 1: histogram
        histogram = image.select(band).reduceRegion(
            reducer=ee.Reducer.histogram(
                maxBuckets=config.otsu_histogram_bins,
                minBucketWidth=0.001,
            ).combine(
                reducer2=ee.Reducer.count(),
                sharedInputs=True,
            ),
            geometry=region,
            scale=config.export_scale,
            maxPixels=1e10,
            bestEffort=True,
        )

        hist_info = ee.Dictionary(histogram.get(band + "_histogram"))
        counts = ee.Array(hist_info.get("histogram"))
        means = ee.Array(hist_info.get("bucketMeans"))

        # Step 2: total count and probabilities
        total = counts.reduce(ee.Reducer.sum(), [0]).get([0])
        probabilities = counts.divide(total)

        # Step 3: cumulative weight (ω₀) and cumulative mean (ω₀·μ₀)
        # We iterate via cumulative sums
        cum_probs = probabilities.accum(0)         # ω₀(t)
        weighted = probabilities.multiply(means)
        cum_means = weighted.accum(0)              # Σ p_i · x_i  up to t

        # Step 4: total mean μ_T
        total_mean = weighted.reduce(ee.Reducer.sum(), [0]).get([0])

        # Step 5: between-class variance σ²_B(t) for every t
        # σ²_B = ω₀ · ω₁ · (μ₀ − μ₁)²
        # where μ₀ = cum_means / ω₀   and  μ₁ = (μ_T − cum_means) / (1 − ω₀)
        #
        # Simplified:
        # σ²_B = (μ_T · ω₀ − cum_means)² / (ω₀ · (1 − ω₀))

        omega0 = cum_probs
        omega1 = omega0.multiply(-1).add(1)  # 1 − ω₀

        numerator = (
            omega0.multiply(total_mean)
            .subtract(cum_means)
            .pow(2)
        )
        denominator = omega0.multiply(omega1).max(ee.Array([1e-10]))  # avoid div/0
        sigma_b_sq = numerator.divide(denominator)

        # Step 6: argmax → optimal threshold
        max_index = sigma_b_sq.argmax()
        threshold = means.get(max_index)

        # Log the numeric threshold (requires getInfo)
        try:
            t_val = ee.Number(threshold).getInfo()
            logger.info("Otsu threshold computed: %.4f", t_val)
        except Exception:
            logger.info("Otsu threshold computed (value deferred to server).")

        return ee.Number(threshold)


def apply_threshold(
    image: ee.Image,
    threshold: ee.Number,
    band: str = "change",
) -> ee.Image:
    """
    Binarise *image* at *threshold*.

    Pixels **above** the threshold are labelled ``1`` (flood);
    pixels at or below are ``0`` (no flood).

    Parameters
    ----------
    image : ee.Image
        Change-detection image.
    threshold : ee.Number
        Threshold value from :func:`otsu_threshold`.
    band : str
        Band to threshold.

    Returns
    -------
    ee.Image
        Binary image named ``"flood_raw"`` (0 / 1).
    """
    binary = image.select(band).gt(threshold).rename(["flood_raw"])
    logger.info("Threshold applied — binary flood mask created.")
    return binary
