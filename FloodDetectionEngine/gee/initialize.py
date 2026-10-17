"""
initialize.py — Google Earth Engine Authentication & Initialization
====================================================================

Handles three authentication strategies in priority order:

1. **Service-account key** – for production / CI pipelines.
   Set ``gee_service_account_key`` in :class:`EngineConfig`.
2. **Project-scoped token** – ``ee.Authenticate()`` + ``ee.Initialize(project=...)``.
   Best for interactive use on a dev machine.
3. **Default credentials** – falls back to ``ee.Initialize()`` with no project,
   which works when the user has previously run ``earthengine authenticate``.

Why a dedicated module?
-----------------------
GEE initialisation is *global state* — calling ``ee.Initialize()`` twice with
different projects raises.  Centralising it here guarantees exactly-once
semantics and consistent error messages.
"""

from __future__ import annotations

import ee

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.utils.logger import get_logger

logger = get_logger(__name__)


def initialize_gee(config: EngineConfig) -> None:
    """
    Authenticate and initialise the Earth Engine Python API.

    Parameters
    ----------
    config : EngineConfig
        Engine configuration object.  Relevant fields:

        - ``gee_project`` – GCP project ID (e.g. ``"ee-floodguardai"``).
        - ``gee_service_account_key`` – path to a service-account JSON key.

    Raises
    ------
    RuntimeError
        If all authentication strategies fail.
    """
    # ── Strategy 1: service-account key ─────────────────────────────────
    if config.gee_service_account_key:
        logger.info(
            "Authenticating with service-account key: %s",
            config.gee_service_account_key,
        )
        try:
            credentials = ee.ServiceAccountCredentials(
                email=None,  # inferred from the key file
                key_file=config.gee_service_account_key,
            )
            ee.Initialize(credentials=credentials, project=config.gee_project)
            logger.info("GEE initialised with service account (project=%s).", config.gee_project)
            return
        except Exception as exc:
            logger.warning(
                "Service-account authentication failed: %s. "
                "Falling through to interactive auth.",
                exc,
            )

    # ── Strategy 2: project-scoped interactive token ────────────────────
    if config.gee_project:
        logger.info(
            "Authenticating interactively for project '%s'.",
            config.gee_project,
        )
        try:
            ee.Authenticate(quiet=True)
            ee.Initialize(project=config.gee_project)
            logger.info("GEE initialised with project '%s'.", config.gee_project)
            return
        except Exception as exc:
            logger.warning(
                "Project-scoped authentication failed: %s. "
                "Falling through to default credentials.",
                exc,
            )

    # ── Strategy 3: default credentials ─────────────────────────────────
    logger.info("Attempting GEE initialisation with default credentials.")
    try:
        ee.Initialize()
        logger.info("GEE initialised with default credentials.")
        return
    except ee.EEException:
        logger.info("No cached credentials found.  Running ee.Authenticate().")
        try:
            ee.Authenticate()
            ee.Initialize()
            logger.info("GEE initialised after interactive authentication.")
            return
        except Exception as exc:
            raise RuntimeError(
                "All GEE authentication strategies failed. "
                "Please run 'earthengine authenticate' in your terminal, "
                "or provide a service-account key / project ID in EngineConfig."
            ) from exc
