import contextlib
import logging
import os
import sys
import typing
from pathlib import Path

DEFAULT_LOG_LEVEL = "DEBUG"
LOG_FMT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"

DEBUGSCBP_NUM = logging.DEBUG - 1
logging.addLevelName(DEBUGSCBP_NUM, "DEBUGSCBP")


def debugscbp(self, message, *args, **kwargs):
    if self.isEnabledFor(DEBUGSCBP_NUM):
        self._log(DEBUGSCBP_NUM, message, args, **kwargs)


logging.Logger.debugscbp = debugscbp
logger = logging.getLogger("scdatatools")

_addon_logging_handler = logging.StreamHandler(stream=sys.stdout)
_addon_logging_handler.formatter = logging.Formatter(LOG_FMT, datefmt="%H:%M:%S")


def setup_addon_logging():
    logger.setLevel(logging.getLevelName(os.environ.get("SCDT_LOGLEVEL", DEFAULT_LOG_LEVEL)))
    _addon_logging_handler.setLevel(logger.level)
    logger.addHandler(_addon_logging_handler)
    logger.propagate = False


def remove_addon_logging():
    while logger.handlers:
        logger.removeHandler(logger.handlers[0])
    logger.propagate = True


@contextlib.contextmanager
def use_log_file(log_file: typing.Union[Path, str]):
    log_file = Path(log_file)
    i = 1
    while log_file.is_file():
        log_file = log_file.parent / f'{log_file.stem.split(".")[0]}.{i}.{log_file.suffix}'
        i += 1
    logger = logging.getLogger("scdatatools")
    log_handler = logging.FileHandler(filename=log_file.as_posix())
    log_handler.setFormatter(logging.Formatter(LOG_FMT))
    logger.addHandler(log_handler)
    yield
    logger.removeHandler(log_handler)
