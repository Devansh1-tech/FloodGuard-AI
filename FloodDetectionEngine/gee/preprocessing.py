"""
preprocessing.py — SAR Image Preprocessing Pipeline
=====================================================

Orchestrates three server-side preprocessing stages that transform
raw Sentinel-1 GRD backscatter into analysis-ready imagery:

1. **Border Noise Removal**
2. **Speckle Filtering** (Refined Lee — see ``filters.py``)
3. **Radiometric Normalisation**

All operations execute on Google Earth Engine servers.

Stage Details
-------------

1. Border Noise Removal
^^^^^^^^^^^^^^^^^^^^^^^^
Sentinel-1 GRD products exhibit low-value noise along swath borders
due to the thermal noise floor of the SAR receiver.  This noise
manifests as anomalously dark strips (< −30 dB) at the image edges
and, if left in, would be misclassified as water.

The removal algorithm:
    a. Threshold the image at ``border_noise_threshold_db`` to
       identify border pixels.
    b. Build a binary mask of *valid* pixels.
    c. Erode the mask by 100 m to remove transition zones.
    d. Multiply the original image by the mask.

2. Speckle Filtering
^^^^^^^^^^^^^^^^^^^^^
SAR imagery is inherently affected by *speckle* — multiplicative
noise caused by constructive and destructive interference of radar
returns within a resolution cell.  The Refined Lee filter (see
:mod:`FloodDetectionEngine.gee.filters`) is applied here.

3. Radiometric Normalisation
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Backscatter intensity varies with local incidence angle, which
differs across the swath and between ascending/descending orbits.
We apply a simple cosine-based terrain correction:

.. math::

    \\sigma^0_{\\text{norm}} = \\sigma^0 \\cdot \\frac{\\cos(\\theta_{\\text{ref}})}{\\cos(\\theta_{\\text{local}})}

where :math:`\\theta_{\\text{ref}}` is the scene-centre incidence angle
and :math:`\\theta_{\\text{local}}` comes from the ``angle`` band of
the GRD product.  For the flat Nepal Terai, terrain effects are
minimal, but the correction improves cross-orbit consistency.
"""

from __future__ import annotations

import ee

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.gee.filters import refined_lee_filter
from FloodDetectionEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


class Preprocessor:
    """
    Sentinel-1 preprocessing pipeline.

    Parameters
    ----------
    config : EngineConfig
        Engine configuration.
    """

    def __init__(self, config: EngineConfig) -> None:
        self.config = config

    # ── public API ──────────────────────────────────────────────────────

    def preprocess(self, image: ee.Image) -> ee.Image:
        """
        Run the full preprocessing chain on a single-band VV image.

        The stages executed depend on the boolean flags in
        :class:`EngineConfig`:

        - ``apply_border_noise_removal``
        - ``apply_speckle_filter``
        - ``apply_radiometric_normalisation``

        Parameters
        ----------
        image : ee.Image
            Raw Sentinel-1 VV median composite (in dB).

        Returns
        -------
        ee.Image
            Preprocessed image (in dB).
        """
        with LogTimer("Full preprocessing", logger):
            if self.config.apply_border_noise_removal:
                image = self.remove_border_noise(image)

            if self.config.apply_speckle_filter:
                image = self.apply_speckle_filter(image)

            if self.config.apply_radiometric_normalisation:
                image = self.normalise_radiometry(image)

        return image

    # ── Stage 1: border noise removal ───────────────────────────────────

    def remove_border_noise(self, image: ee.Image) -> ee.Image:
        """
        Mask out low-intensity border noise strips.

        Sentinel-1 GRD images contain thermal noise artefacts along the
        swath edges that appear as extremely low backscatter values
        (typically < −30 dB).  These would be erroneously classified as
        water if left in the image.

        Algorithm
        ---------
        1. Threshold at ``border_noise_threshold_db`` → binary mask.
        2. Erode mask by ~100 m (10 pixels at 10 m) to trim
           transition zones.
        3. Apply mask to the original image.

        Parameters
        ----------
        image : ee.Image
            Input VV image in dB.

        Returns
        -------
        ee.Image
            Image with border noise masked out.
        """
        with LogTimer("Border noise removal", logger):
            threshold = self.config.border_noise_threshold_db
            band_name = image.bandNames().get(0)

            # Step 1: binary mask where pixel > threshold
            mask = image.select([band_name]).gt(threshold)

            # Step 2: erode to remove transition pixels
            # focal_min with a circle kernel of radius 100 m
            erosion_kernel = ee.Kernel.circle(
                radius=100,
                units="meters",
            )
            mask = mask.focal_min(kernel=erosion_kernel)

            # Step 3: apply mask
            result = image.updateMask(mask)
            logger.info(
                "Border noise removed (threshold=%.1f dB, erosion=100 m).",
                threshold,
            )
            return result

    # ── Stage 2: speckle filtering ──────────────────────────────────────

    def apply_speckle_filter(self, image: ee.Image) -> ee.Image:
        """
        Despeckle the image using the configured filter type.

        Currently supported:
        - ``"refined_lee"`` — Refined Lee adaptive filter (recommended)

        The image is converted from dB to linear scale before filtering
        and back to dB afterward, because speckle is multiplicative in
        linear scale (additive in dB) and the Lee MMSE estimator
        assumes multiplicative noise.

        Parameters
        ----------
        image : ee.Image
            Input VV image in dB.

        Returns
        -------
        ee.Image
            Despeckled image in dB.
        """
        with LogTimer("Speckle filtering", logger):
            band_name = image.bandNames().get(0)

            if self.config.speckle_filter_type == "refined_lee":
                # dB → linear
                linear = ee.Image(10).pow(image.select([band_name]).divide(10))

                # Apply Refined Lee
                filtered_linear = refined_lee_filter(
                    linear,
                    enl=self.config.lee_filter_enl,
                )

                # linear → dB
                filtered_db = (
                    filtered_linear
                    .max(ee.Image(1e-10))  # guard log(0)
                    .log10()
                    .multiply(10)
                    .rename([band_name])
                )
                logger.info("Speckle filter applied: Refined Lee.")
                return filtered_db

            else:
                logger.warning(
                    "Unknown speckle filter type '%s'. Returning unfiltered image.",
                    self.config.speckle_filter_type,
                )
                return image

    # ── Stage 3: radiometric normalisation ──────────────────────────────

    def normalise_radiometry(self, image: ee.Image) -> ee.Image:
        """
        Apply incidence-angle normalisation.

        Backscatter :math:`\\sigma^0` depends on the local incidence
        angle :math:`\\theta`.  We normalise to a reference angle
        (scene centre, ~37° for S1 IW) using:

        .. math::

            \\sigma^0_{\\text{norm}} = \\sigma^0 + 10 \\log_{10}
            \\frac{\\cos(\\theta_{\\text{ref}})}{\\cos(\\theta_{\\text{local}})}

        In dB this simplifies to an additive correction.

        For the **flat Nepal Terai**, terrain-induced incidence angle
        variation is small, so this correction mainly compensates for
        the across-track gain roll-off.

        Parameters
        ----------
        image : ee.Image
            Input VV image in dB (must have an ``angle`` band or the
            angle will be set to the reference value, producing no
            change).

        Returns
        -------
        ee.Image
            Radiometrically normalised image in dB.
        """
        with LogTimer("Radiometric normalisation", logger):
            try:
                available_bands = image.bandNames().getInfo()
            except Exception:
                available_bands = []

            if "angle" not in available_bands:
                logger.info(
                    "Angle band not in image (bands: %s) - skipping radiometric normalisation.",
                    available_bands,
                )
                return image

            band_name = image.bandNames().get(0)
            reference_angle_deg = 37.0  # typical S1 IW mid-range incidence angle

            try:
                angle_band = image.select("angle")
                ref_cos = ee.Image(
                    ee.Number(reference_angle_deg).multiply(ee.Number(3.141592653589793).divide(180)).cos()
                )
                local_cos = angle_band.multiply(
                    ee.Number(3.141592653589793).divide(180)
                ).cos()

                correction_db = ref_cos.divide(local_cos.max(ee.Image(1e-10))).log10().multiply(10)
                normalised = image.select([band_name]).add(correction_db)
                normalised = normalised.rename([band_name])
                logger.info(
                    "Radiometric normalisation applied (ref angle=%.1f deg).",
                    reference_angle_deg,
                )
                return normalised
            except Exception as exc:
                logger.warning(
                    "Radiometric normalisation skipped: %s", exc
                )
                return image
