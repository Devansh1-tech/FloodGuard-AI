"""
change_detection.py — SAR Change Detection Methods
====================================================

Computes a change image from a *before* and *after* Sentinel-1 pair
using one of three standard SAR change-detection operators:

1. **Simple Difference** (After − Before)
2. **Ratio** (Before / After)
3. **Log-Ratio** (log₁₀(Before / After) × scale)  ← *recommended*

All operations are server-side ``ee.Image`` computations.

Mathematical Background
-----------------------

Simple Difference
^^^^^^^^^^^^^^^^^
.. math::

    D = I_{\\text{after}} - I_{\\text{before}}

Advantages: intuitive, fast.
Disadvantages: sensitive to absolute backscatter magnitude; a −3 dB
change at −5 dB and at −20 dB produce the same difference but have
very different physical significance.

Ratio
^^^^^
.. math::

    R = \\frac{I_{\\text{before}}}{I_{\\text{after}}}

Advantages: normalises for absolute magnitude.
Disadvantages: highly skewed distribution; ratio > 1 means backscatter
*decreased* (potential flooding).

Log-Ratio  *(recommended)*
^^^^^^^^^^^^^^^^^^^^^^^^^^^
.. math::

    LR = \\text{scale} \\cdot \\log_{10}
         \\frac{I_{\\text{before}}}{I_{\\text{after}}}

When the images are in dB this simplifies to:

.. math::

    LR = I_{\\text{before}}^{(\\text{dB})}
       - I_{\\text{after}}^{(\\text{dB})}

Advantages:
- Symmetric, approximately Gaussian distribution → ideal for Otsu.
- Normalised for magnitude.
- *Positive* values indicate backscatter decrease → flood candidate.

The ``scale`` factor (default 10) is cosmetic and maps the result
back to a dB-like range.

Why Log-Ratio is Best for Flood Detection
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Flood water acts as a specular reflector — the radar pulse bounces
away from the sensor — causing a *drop* in backscatter.  The
log-ratio directly quantifies this drop as a positive value,
producing a unimodal "background" peak and a secondary "flood" peak
that Otsu's method can cleanly separate.

References
----------
- Rignot, E. & Van Zyl, J. (1993). "Change detection techniques for
  ERS-1 SAR data." *IEEE TGRS*, 31(4), 896–906.
- Bazi, Y., Bruzzone, L. & Melgani, F. (2005). "An unsupervised
  approach based on the generalized Gaussian model to automatic
  change detection in multitemporal SAR images." *IEEE TGRS*, 43(4),
  874–887.
"""

from __future__ import annotations

from typing import Literal

import ee

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


class ChangeDetector:
    """
    SAR change-detection operator.

    Parameters
    ----------
    config : EngineConfig
        Engine configuration.  Relevant fields:

        - ``change_method``   — ``"difference"`` | ``"ratio"`` | ``"log_ratio"``
        - ``log_ratio_scale`` — multiplier for the log-ratio output
    """

    METHODS = ("difference", "ratio", "log_ratio")

    def __init__(self, config: EngineConfig) -> None:
        if config.change_method not in self.METHODS:
            raise ValueError(
                f"Unknown change method '{config.change_method}'. "
                f"Choose from {self.METHODS}."
            )
        self.config = config
        logger.info("ChangeDetector initialised with method '%s'.", config.change_method)

    @property
    def method(self) -> str:
        """Return the active change detection method."""
        return self.config.change_method

    def detect(
        self,
        before: ee.Image,
        after: ee.Image,
    ) -> ee.Image:
        """
        Compute the change image from the before/after pair.

        Parameters
        ----------
        before : ee.Image
            Preprocessed pre-event VV image (dB).
        after : ee.Image
            Preprocessed post-event VV image (dB).

        Returns
        -------
        ee.Image
            Change image.  **Positive values indicate potential
            flooding** (backscatter decrease) for all three methods.
        """
        method = self.config.change_method
        with LogTimer(f"Change detection ({method})", logger):
            if method == "difference":
                return self._difference(before, after)
            elif method == "ratio":
                return self._ratio(before, after)
            elif method == "log_ratio":
                return self._log_ratio(before, after)
            else:
                raise ValueError(f"Unsupported method: {method}")

    # ── private implementations ─────────────────────────────────────────

    @staticmethod
    def _difference(before: ee.Image, after: ee.Image) -> ee.Image:
        """
        Simple difference: before − after.

        Positive values = backscatter decreased = flood candidate.
        """
        diff = before.subtract(after).rename(["change"])
        logger.info("Simple difference image computed.")
        return diff

    @staticmethod
    def _ratio(before: ee.Image, after: ee.Image) -> ee.Image:
        """
        Ratio: before / after  (in linear scale).

        Images are in dB → convert to linear, divide, convert back.
        Values > 1 indicate backscatter decrease.
        """
        before_lin = ee.Image(10).pow(before.divide(10))
        after_lin = ee.Image(10).pow(after.divide(10))
        ratio = before_lin.divide(after_lin.max(ee.Image(1e-10)))
        ratio = ratio.rename(["change"])
        logger.info("Ratio image computed (linear scale).")
        return ratio

    def _log_ratio(self, before: ee.Image, after: ee.Image) -> ee.Image:
        """
        Log-ratio: scale × log₁₀(before_lin / after_lin).

        Because images are already in dB (= 10 log₁₀ linear), this
        is equivalent to ``before_dB − after_dB`` (with appropriate
        scaling).

        Positive values = flood candidate.
        """
        # Direct dB subtraction (mathematically identical to log-ratio)
        log_ratio = before.subtract(after).rename(["change"])

        # Apply optional scale factor (identity if scale == 10 and
        # images are already in 10·log₁₀ form)
        if self.config.log_ratio_scale != 10.0:
            scale_factor = self.config.log_ratio_scale / 10.0
            log_ratio = log_ratio.multiply(scale_factor)

        logger.info(
            "Log-ratio image computed (scale=%.1f).",
            self.config.log_ratio_scale,
        )
        return log_ratio
