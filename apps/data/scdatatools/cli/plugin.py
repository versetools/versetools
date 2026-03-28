import argparse
import logging
import os
import threading

from nubia import PluginInterface, context
from rich.console import Console
from rich.logging import RichHandler
from termcolor import colored

from scdatatools import __version__


class SCDTContext(context.Context):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.cache_dir = None

    @property
    def verbose(self):
        return self.args.verbose


class ErrorFilter(logging.Filter):
    def filter(self, record):
        if record.levelno == logging.INFO:
            return False

        # colorize the level
        level = record.levelname.lower()  # .rjust(8)
        if record.levelno <= logging.DEBUG:
            level = colored(level, "blue")
        elif record.levelno >= logging.ERROR:
            level = colored(level, "red")
        elif record.levelno >= logging.WARNING:
            level = colored(level, "yellow")
        record.level = level

        # logger name
        if record.name == "__main__":
            logger_name = "scdt"
        else:
            logger_name = record.name.split(".")[-1]
        record.logger_name = logger_name

        # thread name (optional)
        record.thread = ""
        if record.levelno <= logging.DEBUG:
            thread = threading.current_thread().getName()
            if thread != "MainThread":
                record.thread = "thread {}: ".format(thread)
        return True


class InfoFilter(logging.Filter):
    def filter(self, record):
        return record.levelno == logging.INFO


class SCDTNubiaPlugin(PluginInterface):
    """
    The PluginInterface class is a way to customize nubia for every customer
    use case. It allowes custom argument validation, control over command
    loading, custom context objects, and much more.
    """

    def create_context(self):
        """
        Must create an object that inherits from `Context` parent class.
        The plugin can return a custom context but it has to inherit from the
        correct parent class.
        """
        return SCDTContext()

    def validate_args(self, args):
        """
        This will be executed when starting nubia, the args passed is a
        dict-like object that contains the argparse result after parsing the
        command line arguments. The plugin can choose to update the context
        with the values, and/or decide to raise `ArgsValidationError` with
        the error message.
        """
        ctx: SCDTContext = context.get_context()
        ctx.cache_dir = args.cache_dir
        # ctx.set_verbose(args.verbose)
        if ctx.cache_dir is None:
            ctx.cache_dir = os.environ.get("SCDT_CACHE_DIR", None)

    def get_opts_parser(self, add_help=True):
        """
        Builds the ArgumentParser that will be passed to , use this to
        build your list of arguments that you want for your shell.
        """
        opts_parser = argparse.ArgumentParser(
            description=f"scdt - Star Citizen Data Tools v{__version__}",
            formatter_class=argparse.ArgumentDefaultsHelpFormatter,
            add_help=add_help,
        )
        opts_parser.add_argument(
            "--verbose",
            "-v",
            action="count",
            default=0,
            help="Increase verbosity, can be specified multiple times",
        )
        opts_parser.add_argument(
            "--cache-dir",
            "-C",
            default=None,
            help="Set a cache directory for scdt to use for faster loading times for some commands. The cache directory"
            " can also be set with the SCDT_CACHE_DIR environment variable.",
        )
        return opts_parser

    def setup_logging(self, root_logger, args):
        if args.verbose and args.verbose >= 2:
            logging_level = logging.DEBUG
        elif args.verbose == 1:
            logging_level = logging.INFO
        else:
            logging_level = logging.WARN

        # err_fmt = logging.Formatter(fmt="[%(asctime)-15s] [%(level)s] [%(name)s] %(thread)s%(message)s")
        err_console = Console(stderr=True)
        err_handler = RichHandler(
            console=err_console, rich_tracebacks=True, tracebacks_show_locals=True
        )
        err_handler.addFilter(ErrorFilter())
        logging.root.addHandler(err_handler)

        std_handler = RichHandler(show_time=False, show_level=False, show_path=False)
        std_handler.addFilter(InfoFilter())
        logging.root.addHandler(std_handler)

        logging.root.setLevel(logging_level)
        return root_logger
