"""
flood_mask.py — Flood Mask Generation Orchestrator
====================================================

Ties together the detection sub-modules to produce a clean binary
flood mask from a pair of preprocessed SAR images:

1. Change detection  (``change_detection.py``)
2. Otsu thresholding (``otsu.py``)
3. Morphological cleaning (``morphology.py``)

This module is the **single entry point** that the pipeline calls.
"""

from __future__ import annotations

from typing import Tuple

import ee

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.detection.change_detection import ChangeDetector
from FloodDetectionEngine.detection.otsu import otsu_threshold, apply_threshold
from FloodDetectionEngine.detection.morphology import MorphologyCleaner
from FloodDetectionEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


class FloodMaskGenerator:
    """
    End-to-end flood mask generator.

    Parameters
    ----------
    config : EngineConfig
        Engine configuration.

    Attributes
    ----------
    change_detector : ChangeDetector
    morphology_cleaner : MorphologyCleaner
    """

    def __init__(self, config: EngineConfig) -> None:
        self.config = config
        self.change_detector = ChangeDetector(config)
        self.morphology_cleaner = MorphologyCleaner(config)
        logger.info("FloodMaskGenerator initialised.")

    def generate(
        self,
        before: ee.Image,
        after: ee.Image,
        aoi: ee.Geometry,
    ) -> Tuple[ee.Image, ee.Image, ee.Number]:
        """
        Generate a clean flood mask from before/after SAR images.

        Parameters
        ----------
        before : ee.Image
            Preprocessed pre-event image (dB).
        after : ee.Image
            Preprocessed post-event image (dB).
        aoi : ee.Geometry
            Area of interest for histogram computation.

        Returns
        -------
        tuple[ee.Image, ee.Image, ee.Number]
            - ``change_image`` — the raw change-detection image
            - ``flood_mask``   — cleaned binary flood mask (0/1)
            - ``threshold``    — the Otsu threshold value
        """
        with LogTimer("Flood mask generation", logger):
            # Step 1: change detection
            logger.info("Step 1/3: Computing change image...")
            change_image = self.change_detector.detect(before, after)

            # Step 2: automatic thresholding
            logger.info("Step 2/3: Computing Otsu threshold...")
            threshold = otsu_threshold(
                image=change_image,
                region=aoi,
                config=self.config,
            )
            raw_mask = apply_threshold(change_image, threshold)

            # Step 3: morphological cleaning
            logger.info("Step 3/3: Morphological cleaning...")
            flood_mask = self.morphology_cleaner.clean(raw_mask)

        return change_image, flood_mask, threshold
