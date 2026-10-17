"""
logger.py — Professional Structured Logging
============================================

Provides a pre-configured ``logging.Logger`` instance and a context-manager
``LogTimer`` that automatically records wall-clock execution time for any
named block of work.

Features
--------
- Console handler with coloured level names (if the terminal supports it).
- Rotating file handler (5 MB, 3 backups) so logs never consume disk unboundedly.
- ``LogTimer`` context manager prints elapsed time on exit, useful for profiling
  pipeline stages.

Usage
-----
::

    from FloodDetectionEngine.utils.logger import get_logger, LogTimer

    logger = get_logger(__name__)
    logger.info("Starting flood detection pipeline")

    with LogTimer("Sentinel-1 loading", logger):
        # ... expensive work ...
        pass
"""

from __future__ import annotations

import logging
import os
import sys
import time
from logging.handlers import RotatingFileHandler
from typing import Optional


# ── colour codes (ANSI, no dependency) ──────────────────────────────────────

_RESET = "\033[0m"
_LEVEL_COLOURS = {
    "DEBUG": "\033[36m",      # cyan
    "INFO": "\033[32m",       # green
    "WARNING": "\033[33m",    # yellow
    "ERROR": "\033[31m",      # red
    "CRITICAL": "\033[1;31m", # bold red
}


class _ColourFormatter(logging.Formatter):
    """Formatter that injects ANSI colour codes around the level name."""

    _BASE_FMT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    _DATE_FMT = "%Y-%m-%d %H:%M:%S"

    def __init__(self) -> None:
        super().__init__(fmt=self._BASE_FMT, datefmt=self._DATE_FMT)

    def format(self, record: logging.LogRecord) -> str:  # noqa: A003
        colour = _LEVEL_COLOURS.get(record.levelname, "")
        record.levelname = f"{colour}{record.levelname}{_RESET}"
        return super().format(record)


class _PlainFormatter(logging.Formatter):
    """Formatter without colour codes (for log files)."""

    _BASE_FMT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    _DATE_FMT = "%Y-%m-%d %H:%M:%S"

    def __init__(self) -> None:
        super().__init__(fmt=self._BASE_FMT, datefmt=self._DATE_FMT)


# ── singleton registry ─────────────────────────────────────────────────────

_CONFIGURED: bool = False


def _configure_root(
    level: str = "INFO",
    log_file: Optional[str] = None,
) -> None:
    """One-time setup of the root ``FloodDetectionEngine`` logger."""
    global _CONFIGURED
    if _CONFIGURED:
        return
    _CONFIGURED = True

    root = logging.getLogger("FloodDetectionEngine")
    root.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Console handler
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(_ColourFormatter())
    root.addHandler(console)

    # File handler (optional)
    if log_file:
        os.makedirs(os.path.dirname(log_file) if os.path.dirname(log_file) else ".", exist_ok=True)
        fh = RotatingFileHandler(
            log_file,
            maxBytes=5 * 1024 * 1024,  # 5 MB
            backupCount=3,
            encoding="utf-8",
        )
        fh.setFormatter(_PlainFormatter())
        root.addHandler(fh)


def get_logger(
    name: str,
    level: str = "INFO",
    log_file: Optional[str] = "floodguard.log",
) -> logging.Logger:
    """
    Return a child logger under the ``FloodDetectionEngine`` namespace.

    Parameters
    ----------
    name : str
        Module or component name (typically ``__name__``).
    level : str
        Minimum log level (``DEBUG``, ``INFO``, ``WARNING``, ``ERROR``).
    log_file : str | None
        Path to the rotating log file.  Pass ``None`` to disable file logging.

    Returns
    -------
    logging.Logger
        Ready-to-use logger instance.
    """
    _configure_root(level=level, log_file=log_file)
    return logging.getLogger(f"FloodDetectionEngine.{name}")


# ── execution timer ─────────────────────────────────────────────────────────

class LogTimer:
    """
    Context manager that measures and logs wall-clock time of a block.

    Parameters
    ----------
    label : str
        Human-readable label for the block being timed.
    logger : logging.Logger
        Logger to emit start / finish messages.

    Example
    -------
    ::

        with LogTimer("Speckle filtering", logger):
            image = apply_refined_lee(image)
    """

    def __init__(self, label: str, logger: logging.Logger) -> None:
        self.label = label
        self.logger = logger
        self._start: float = 0.0
        self.elapsed: float = 0.0

    def __enter__(self) -> "LogTimer":
        self.logger.info("▶ %s — started", self.label)
        self._start = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:  # type: ignore[override]
        self.elapsed = time.perf_counter() - self._start
        if exc_type is not None:
            self.logger.error(
                "✖ %s — failed after %.2f s (%s: %s)",
                self.label,
                self.elapsed,
                exc_type.__name__,
                exc_val,
            )
        else:
            self.logger.info(
                "✔ %s — completed in %.2f s",
                self.label,
                self.elapsed,
            )
