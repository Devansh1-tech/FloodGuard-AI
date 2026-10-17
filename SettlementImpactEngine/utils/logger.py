"""
logger.py — Centralized Logging Infrastructure
==============================================

Provides structured, timed, and level-controlled logging across all
modules in SettlementImpactEngine. Supports console streaming and file logging.
"""

from __future__ import annotations

import logging
import os
import sys
import time
from pathlib import Path
from typing import Optional

_LOGGERS: dict[str, logging.Logger] = {}
DEFAULT_LOG_FORMAT = "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"
DEFAULT_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def get_logger(
    name: str = "SettlementImpactEngine",
    level: Optional[str] = None,
    log_file: Optional[str] = None,
) -> logging.Logger:
    """
    Retrieve or create a configured logger instance.

    Parameters
    ----------
    name : str
        Namespace for the logger (typically ``__name__``).
    level : str | None
        Override log level (e.g., ``"DEBUG"``, ``"INFO"``, ``"WARNING"``).
    log_file : str | None
        Optional file path to persist log entries.

    Returns
    -------
    logging.Logger
        Configured logger instance.
    """
    if name in _LOGGERS:
        return _LOGGERS[name]

    logger = logging.getLogger(name)
    resolved_level = getattr(
        logging,
        (level or os.getenv("LOG_LEVEL", "INFO")).upper(),
        logging.INFO,
    )
    logger.setLevel(resolved_level)

    # Avoid duplicate handlers if parent already configured
    if not logger.handlers:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(resolved_level)
        formatter = logging.Formatter(DEFAULT_LOG_FORMAT, DEFAULT_DATE_FORMAT)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        if log_file:
            path = Path(log_file)
            path.parent.mkdir(parents=True, exist_ok=True)
            file_handler = logging.FileHandler(str(path), encoding="utf-8")
            file_handler.setLevel(resolved_level)
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)

    logger.propagate = False
    _LOGGERS[name] = logger
    return logger


class LogTimer:
    """
    Context manager to accurately measure and log execution duration.

    Usage
    -----
    >>> with LogTimer("Intersecting Administrative Boundaries", logger):
    >>>     run_spatial_intersection(...)
    """

    def __init__(self, operation_name: str, logger: Optional[logging.Logger] = None) -> None:
        self.operation_name = operation_name
        self.logger = logger or get_logger("Timer")
        self.start_time: float = 0.0

    def __enter__(self) -> LogTimer:
        self.start_time = time.perf_counter()
        self.logger.info("[>] %s - started", self.operation_name)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        elapsed = time.perf_counter() - self.start_time
        if exc_type is None:
            self.logger.info("[+] %s - completed in %.2f s", self.operation_name, elapsed)
        else:
            self.logger.error(
                "[x] %s - failed after %.2f s (%s: %s)",
                self.operation_name,
                elapsed,
                exc_type.__name__,
                exc_val,
            )
