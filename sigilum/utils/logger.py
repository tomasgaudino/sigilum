# sigilum/utils/logger.py
from __future__ import annotations
import logging, sys
from pathlib import Path

_LOGGER_NAME = "sigilum"

def setup_console_logging(level: str = "INFO"):
    logger = logging.getLogger(_LOGGER_NAME)
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    logger.handlers.clear()
    fmt = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s", datefmt="%H:%M:%S")
    sh = logging.StreamHandler(sys.stderr)
    sh.setLevel(logger.level)
    sh.setFormatter(fmt)
    logger.addHandler(sh)
    return logger

def add_file_logging(logfile: str | Path, level: str | None = None):
    logger = logging.getLogger(_LOGGER_NAME)
    logfile = Path(logfile)
    logfile.parent.mkdir(parents=True, exist_ok=True)
    fmt = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    fh = logging.FileHandler(logfile, encoding="utf-8")
    if level:
        fh.setLevel(getattr(logging, level.upper(), logging.INFO))
    fh.setFormatter(fmt)
    logger.addHandler(fh)
    logger.info(f"File logging enabled → {logfile}")
    return logger

def get_logger():
    return logging.getLogger(_LOGGER_NAME)
