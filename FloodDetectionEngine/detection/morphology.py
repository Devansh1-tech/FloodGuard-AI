"""
morphology.py — Binary Mask Morphological Cleaning
====================================================

After thresholding, the raw flood mask contains noise: isolated
false-positive pixels, thin bridges, and small holes inside flooded
areas.  This module applies a sequence of **mathematical morphology**
operators (server-side ``ee.Image`` focal operations) to produce a
clean, cartographically sound flood mask.

Morphological Operations Explained
------------------------------------

1. Opening (erosion → dilation)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Removes small bright objects (false-positive flood pixels) that are
narrower than the structuring element.  The erosion step shrinks all
features, eliminating those smaller than the kernel; the dilation
step restores the remaining features to approximately their original
size.

.. math::

    \\text{Opening}(A) = (A \\ominus B) \\oplus B

where :math:`A` is the binary mask, :math:`B` is the disk kernel,
:math:`\\ominus` is erosion, and :math:`\\oplus` is dilation.

2. Closing (dilation → erosion)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Fills small dark holes (missed flood pixels inside a flooded region)
and connects narrow gaps.

.. math::

    \\text{Closing}(A) = (A \\oplus B) \\ominus B

3. Hole Filling
^^^^^^^^^^^^^^^^
After closing, any remaining interior holes (pixels surrounded by
flood on all sides) are filled using connected-component labelling
on the *inverse* mask.

4. Connected-Component Filtering (Minimum Mapping Unit)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Small isolated flood patches that survived opening — often caused
by look-angle artefacts or residual speckle — are removed by
labelling connected components and discarding those below a
configurable area threshold (the **minimum mapping unit**, MMU).

Why These Steps Matter
-----------------------
Without morphological cleaning, the flood map would be noisy and
unusable for impact assessment.  A single spurious pixel flagged as
flood could incorrectly tag a settlement as "affected."

References
----------
- Serra, J. (1982). *Image Analysis and Mathematical Morphology.*
  Academic Press.
- Soille, P. (2004). *Morphological Image Analysis.* 2nd ed.
  Springer.
"""

from __future__ import annotations

import ee

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


class MorphologyCleaner:
    """
    Morphological cleaning pipeline for binary flood masks.

    Parameters
    ----------
    config : EngineConfig
        Engine configuration.  Relevant fields:

        - ``morphology_opening_radius``   — kernel radius for opening (pixels)
        - ``morphology_closing_radius``   — kernel radius for closing (pixels)
        - ``min_mapping_unit_pixels``     — smallest retained component (pixels)
        - ``fill_holes``                  — whether to fill interior holes
    """

    def __init__(self, config: EngineConfig) -> None:
        self.config = config
        logger.info(
            "MorphologyCleaner initialised — opening_r=%d, closing_r=%d, MMU=%d px.",
            config.morphology_opening_radius,
            config.morphology_closing_radius,
            config.min_mapping_unit_pixels,
        )

    def clean(self, mask: ee.Image) -> ee.Image:
        """
        Run the full morphological cleaning pipeline.

        Sequence: opening → closing → hole fill → connected-component filter.

        Parameters
        ----------
        mask : ee.Image
            Binary flood mask (0 / 1) from thresholding.

        Returns
        -------
        ee.Image
            Cleaned binary flood mask named ``"flood_mask"``.
        """
        with LogTimer("Morphological cleaning", logger):
            result = mask

            # Step 1: opening — remove isolated false positives
            result = self.opening(result)

            # Step 2: closing — fill small gaps / holes
            result = self.closing(result)

            # Step 3: fill interior holes
            if self.config.fill_holes:
                result = self.fill_holes(result)

            # Step 4: connected-component filtering (MMU)
            if self.config.min_mapping_unit_pixels > 0:
                result = self.filter_connected_components(result)

            result = result.rename(["flood_mask"])
            logger.info("Morphological cleaning complete.")
            return result

    # ── individual operations ───────────────────────────────────────────

    def opening(self, mask: ee.Image) -> ee.Image:
        """
        Morphological opening: erosion followed by dilation.

        Removes objects smaller than the structuring element (isolated
        false-positive flood pixels).

        Parameters
        ----------
        mask : ee.Image
            Binary mask.

        Returns
        -------
        ee.Image
            Opened mask.
        """
        radius = self.config.morphology_opening_radius
        if radius <= 0:
            return mask
        kernel = ee.Kernel.circle(radius=radius, units="pixels")
        eroded = mask.focal_min(kernel=kernel)
        opened = eroded.focal_max(kernel=kernel)
        logger.debug("Opening applied (radius=%d px).", radius)
        return opened

    def closing(self, mask: ee.Image) -> ee.Image:
        """
        Morphological closing: dilation followed by erosion.

        Fills small interior holes and connects narrow breaks.

        Parameters
        ----------
        mask : ee.Image
            Binary mask.

        Returns
        -------
        ee.Image
            Closed mask.
        """
        radius = self.config.morphology_closing_radius
        if radius <= 0:
            return mask
        kernel = ee.Kernel.circle(radius=radius, units="pixels")
        dilated = mask.focal_max(kernel=kernel)
        closed = dilated.focal_min(kernel=kernel)
        logger.debug("Closing applied (radius=%d px).", radius)
        return closed

    def fill_holes(self, mask: ee.Image) -> ee.Image:
        """
        Fill interior holes in the flood mask.

        Strategy: label connected components of the *inverse* mask.
        The largest component is the background; all others are holes
        inside flooded regions and should be filled (set to 1).

        Parameters
        ----------
        mask : ee.Image
            Binary mask.

        Returns
        -------
        ee.Image
            Mask with holes filled.
        """
        # Invert: 1 = non-flood, 0 = flood
        inverse = mask.Not()

        # Connected components of the inverse
        components = inverse.selfMask().connectedComponents(
            connectedness=ee.Kernel.plus(1),
            maxSize=1024,
        )

        # The label band contains component IDs; largest component = background
        labels = components.select("labels")

        # Compute area (pixel count) per label
        component_area = labels.connectedPixelCount(maxSize=1024)

        # Background is the largest connected region of non-flood
        # Heuristic: background has the most pixels
        # Set everything that is NOT background to flood (fill holes)
        max_area = component_area.reduceRegion(
            reducer=ee.Reducer.max(),
            geometry=mask.geometry(),
            scale=10,
            maxPixels=1e10,
            bestEffort=True,
        ).values().get(0)

        # Pixels where component area < max → they're holes → fill with 1
        holes = component_area.lt(ee.Number(max_area))
        filled = mask.Or(holes)
        logger.debug("Interior holes filled.")
        return filled

    def filter_connected_components(self, mask: ee.Image) -> ee.Image:
        """
        Remove flood patches smaller than the minimum mapping unit.

        Uses ``connectedPixelCount`` to measure patch size and
        eliminates those below ``min_mapping_unit_pixels``.

        Parameters
        ----------
        mask : ee.Image
            Binary mask.

        Returns
        -------
        ee.Image
            Mask with small components removed.
        """
        mmu = self.config.min_mapping_unit_pixels
        # Count connected pixels for each flood pixel
        pixel_count = mask.selfMask().connectedPixelCount(maxSize=1024)
        # Keep only components ≥ MMU
        filtered = mask.updateMask(pixel_count.gte(mmu))
        # Unmask back to 0 for non-flood
        filtered = filtered.unmask(0)
        logger.debug("Connected-component filter applied (MMU=%d px).", mmu)
        return filtered
