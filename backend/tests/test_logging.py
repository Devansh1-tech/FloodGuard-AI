"""
test_logging.py — Structured Logging Infrastructure Tests
=========================================================
"""

import logging
from pathlib import Path
import tempfile
import pytest

from app.core.logging import get_logger, setup_logging


def test_get_logger_singleton():
    """Verify that get_logger returns a namespaced logger instance."""
    l1 = get_logger("TestLogger")
    l2 = get_logger("TestLogger")
    assert l1 is l2
    assert l1.name == "TestLogger"


def test_setup_logging_file_output():
    """Verify setup_logging configures file handler and writes records."""
    with tempfile.TemporaryDirectory() as tmpdir:
        log_file = Path(tmpdir) / "test_run.log"
        setup_logging(level="DEBUG", log_file=str(log_file))

        logger = get_logger("FileLoggerTest")
        test_message = "Test log entry for FloodGuard AI"
        logger.info(test_message)

        # Flush handlers
        for handler in logging.getLogger().handlers:
            handler.flush()

        assert log_file.exists()
        content = log_file.read_text(encoding="utf-8")
        assert test_message in content
        assert "INFO" in content

        # Close all handlers to release Windows file locks
        for handler in list(logging.getLogger().handlers):
            handler.close()
            logging.getLogger().removeHandler(handler)
