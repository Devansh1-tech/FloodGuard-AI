"""
sentinel_loader.py — Sentinel-1 GRD Image Loader
==================================================

Loads ``COPERNICUS/S1_GRD`` imagery from the Google Earth Engine
catalogue, applying the full suite of metadata filters specified in
:class:`EngineConfig`:

- Area of Interest (AOI) clip
- Date range (before / after event windows)
- Instrument Mode  → ``IW`` (Interferometric Wide-swath)
- Orbit Pass       → ``DESCENDING``
- Polarization     → ``VV``
- Resolution       → 10 m

The loader produces **median composites** from each date window to
reduce transient artefacts (aircraft, ships, RFI) and returns
single-band ``ee.Image`` objects ready for preprocessing.

Why Descending Orbit?
---------------------
Sentinel-1 acquires in both ascending (evening) and descending
(morning) passes.  Descending orbits over South Asia image the
Terai region with a more favourable incidence angle and more
consistent acquisition geometry, reducing layover / shadow
artefacts in the flat terrain.

Why Median Composite?
---------------------
A temporal median is a robust estimator that suppresses outlier
pixels (transient scatterers, orbit-edge noise) without the
blurring that a mean would introduce.
"""

from __future__ import annotations

from typing import Tuple

import ee

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


class SentinelLoader:
    """
    Factory for before / after Sentinel-1 VV median composites.

    Parameters
    ----------
    config : EngineConfig
        Engine configuration (dates, AOI, S1 filter params).

    Attributes
    ----------
    aoi : ee.Geometry.Polygon
        Earth Engine geometry built from the configured AOI.
    """

    def __init__(self, config: EngineConfig) -> None:
        self.config = config
        coords = config.get_aoi_coordinates()
        try:
            self.aoi: Optional[ee.Geometry] = ee.Geometry.Polygon([coords])
        except Exception:
            self.aoi = None
        logger.info(
            "SentinelLoader initialised - AOI: %s, Before: %s -> %s, After: %s -> %s",
            config.aoi_name,
            config.before_start,
            config.before_end,
            config.after_start,
            config.after_end,
        )

    # ── public API ──────────────────────────────────────────────────────

    def load_before_image(self) -> ee.Image:
        """
        Load and composite the pre-event Sentinel-1 collection.

        Returns
        -------
        ee.Image
            Single-band ``VV`` median composite clipped to the AOI.
        """
        with LogTimer("Load before image", logger):
            return self._load_composite(
                start=self.config.before_start,
                end=self.config.before_end,
                label="before",
            )

    def load_after_image(self) -> ee.Image:
        """
        Load and composite the post-event Sentinel-1 collection.

        Returns
        -------
        ee.Image
            Single-band ``VV`` median composite clipped to the AOI.
        """
        with LogTimer("Load after image", logger):
            return self._load_composite(
                start=self.config.after_start,
                end=self.config.after_end,
                label="after",
            )

    def load_pair(self) -> Tuple[ee.Image, ee.Image]:
        """
        Convenience method to load both before and after images.

        Returns
        -------
        tuple[ee.Image, ee.Image]
            ``(before_image, after_image)``
        """
        return self.load_before_image(), self.load_after_image()

    # ── internals ───────────────────────────────────────────────────────

    def _build_collection(
        self,
        start: str,
        end: str,
    ) -> ee.ImageCollection:
        """
        Build a filtered Sentinel-1 GRD ``ee.ImageCollection``.

        Filters applied
        ---------------
        1. ``instrumentMode == IW``
        2. ``orbitProperties_pass == DESCENDING``
        3. ``resolution_meters == 10``
        4. Date range ``[start, end)``
        5. Spatial bounds (AOI)
        6. Select ``VV`` band only

        Parameters
        ----------
        start, end : str
            ISO-8601 date strings.

        Returns
        -------
        ee.ImageCollection
            Filtered collection (may be empty if no acquisitions match).
        """
        collection = (
            ee.ImageCollection("COPERNICUS/S1_GRD")
            .filter(ee.Filter.eq("instrumentMode", self.config.instrument_mode))
            .filter(ee.Filter.eq("orbitProperties_pass", self.config.orbit_pass))
            .filter(ee.Filter.eq("resolution_meters", self.config.resolution_meters))
            .filterDate(start, end)
            .filterBounds(self.aoi)
            .select(self.config.polarization)
        )
        return collection

    def _load_composite(
        self,
        start: str,
        end: str,
        label: str,
    ) -> ee.Image:
        """
        Build the collection, compute median, and clip to AOI.

        Parameters
        ----------
        start, end : str
            Date window boundaries.
        label : str
            Human-readable label for logging (``"before"`` / ``"after"``).

        Returns
        -------
        ee.Image
            Median composite, single band, clipped.

        Raises
        ------
        RuntimeError
            If the collection is empty (no images matched the filters).
        """
        collection = self._build_collection(start, end)

        # Server-side count — we log the value lazily via getInfo()
        count = collection.size()
        count_local = count.getInfo()
        if count_local == 0:
            raise RuntimeError(
                f"No Sentinel-1 images found for the {label} window "
                f"({start} → {end}).  Check dates, AOI, and orbit pass."
            )
        logger.info(
            "Sentinel-1 %s collection: %d image(s) in [%s, %s)",
            label,
            count_local,
            start,
            end,
        )

        composite = collection.median().clip(self.aoi)
        composite = composite.rename([f"{self.config.polarization}"])
        logger.info("Median composite created for %s window.", label)
        return composite
