"""
logging.py — Centralized Structured Logging Infrastructure
==========================================================

Configures dual-output structured logging to standard output and rotating
log files with standardized ISO timestamps and severity markers.
"""

from __future__ import annotations

import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Optional

from app.config.settings import get_settings

_LOGGERS: dict[str, logging.Logger] = {}
DEFAULT_FORMAT = "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def setup_logging(
    level: Optional[str] = None,
    log_file: Optional[str] = None,
    log_level: Optional[str] = None,
    log_dir: Optional[str] = None,
) -> None:
    """
    Initialize root logging configuration for the backend.
    """
    settings = get_settings()
    effective_level_str = level or log_level or settings.LOG_LEVEL
    effective_log_level = getattr(logging, effective_level_str.upper(), logging.INFO)
    file_path = log_file or settings.LOG_FILE_PATH
    if log_dir and not log_file:
        file_path = str(Path(log_dir) / "backend.log")

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(effective_log_level)

    # Avoid duplicate handlers
    root_logger.handlers.clear()

    formatter = logging.Formatter(DEFAULT_FORMAT, DATE_FORMAT)

    # Console Stream Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(effective_log_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # Rotating File Handler (10MB per file, up to 5 backups)
    if file_path:
        p = Path(file_path)
        p.parent.mkdir(parents=True, exist_ok=True)
        file_handler = RotatingFileHandler(
            str(p),
            maxBytes=10 * 1024 * 1024,
            backupCount=5,
            encoding="utf-8",
        )
        file_handler.setLevel(effective_log_level)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

    # Suppress verbose third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Retrieve a namespaced logger instance."""
    if name not in _LOGGERS:
        logger = logging.getLogger(name)
        _LOGGERS[name] = logger
    return _LOGGERS[name]
