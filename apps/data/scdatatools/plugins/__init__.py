import importlib
import logging
import pkgutil
import typing
from pathlib import Path

logger = logging.getLogger(__name__)

if typing.TYPE_CHECKING:
    from scdatatools.p4k import P4KInfo


class HandlerNotAvailable(Exception):
    pass


class DataToolsPlugin:
    def register(self):
        pass

    def unregister(self):
        pass


class P4KConverterPlugin(DataToolsPlugin):
    # List of file suffixes that this converter handles. This is used to easily select which files to
    # run converters for
    name = ""
    display_name = ""
    handles = []
    converter_hook_kwargs = {}

    CONVERTER_HOOK = "scdt.p4k_converter"

    def register(self):
        super().register()
        plugin_manager.register_hook(
            P4KConverterPlugin.CONVERTER_HOOK, self.__class__, **self.converter_hook_kwargs
        )

    @classmethod
    def converters(cls):
        return dict(plugin_manager.hooks(cls.CONVERTER_HOOK))

    @staticmethod
    def outpath(outdir, member, save_to):
        """Return the output path for the given member and the given save_to state"""
        if save_to:
            return outdir / Path(member.filename).name
        return outdir / Path(member.filename)

    @classmethod
    def convert(
        cls,
        members: typing.List["P4KInfo"],
        path: typing.Union[Path, str],
        overwrite: bool = False,
        save_to: bool = False,
        options: typing.Dict = None,
        monitor: typing.Callable = None,
    ) -> typing.List["P4KInfo"]:
        """Handles converting `P4KInfo` files from the given list. Returns the list of members there were _not_ handled
        by this converter

        :param members: List of `P4KInfo` files to attempt to convert
        :param path: The output directory to extract/convert the files to
        :param overwrite: Overwrite existing files on disk. If not overwritten, the P4KInfo will still be removed from
            the resulting list as being handled.
        :param save_to: `bool` whether or not this is a `save_to` vs `extract_to`. The difference being `save_to` will
            not recreate the directory structure within `path` where `extract_to` will
        :param options: Optional parameters for the converter
        :param monitor: A callable that the converter can use to output logging messages
        :returns: List of `P4KInfo` members that were _not_ handled by this converter
        """
        return members


class PluginManager:
    PACKAGE_PREFIX = "scdatatools_"
    PLUGIN_CLASS = DataToolsPlugin
    HandlerNotAvailable = HandlerNotAvailable

    def __init__(self):
        self.plugins = {}
        self._setup = False
        self._hooks = {}

    def setup(self):
        if not self._setup:
            # Ensure scdatatools "plugins" are also loaded here

            self.discover_plugins()
            self._setup = True

    def register_plugin(self, plugin: DataToolsPlugin):
        plug = f"{plugin.__module__}.{plugin.__qualname__}"
        if not issubclass(plugin, self.PLUGIN_CLASS):
            raise ValueError(
                f'Invalid plugin class type for "{plug}", must inherit from {self.PLUGIN_CLASS}'
            )
        if plug in self.plugins:
            raise KeyError(f"Plugin {plug} has already been registered")
        self.plugins[plug] = plugin()
        self.plugins[plug].register()
        logger.info(f"Registered plugin {plug}")

    def unregister_plugin(self, plugin: DataToolsPlugin):
        plug = f"{plugin.__module__}.{plugin.__qualname__}"
        if plug in self.plugins:
            raise KeyError(f"Plugin {plug} is not registered")
        self.plugins[plug].unregister()
        del self.plugins[plug]
        logger.info(f"Unregistered plugin {plug}")

    def register_hook(self, hook: str, handler: callable, name=None, priority=100, **kwargs):
        """Registers `func` with the hook `hook`"""
        hook_name = f"{handler.__module__}{handler.__name__}" if name is None else name
        self._hooks.setdefault(hook, {})[hook_name] = {
            "handler": handler,
            "kwargs": kwargs,
            "priority": priority,
        }
        return self._hooks[hook][hook_name]

    def unregister_hook(self, hook: str, handler: typing.Union[callable, str]):
        """Removes `func` from the hook `hook`"""
        if isinstance(handler, callable):
            hook_name = f"{handler.__module__}{handler.__name__}"
        else:
            hook_name = handler
        if hook_name in self._hooks.setdefault(hook, {}):
            self._hooks.pop(hook_name)

    def hooks(self, hook):
        """Returns the registered handlers for `hook` sorted by priority"""
        return sorted(self._hooks.get(hook, {}).items(), key=lambda h: h[1]["priority"])

    def handle_hook(self, hook, *args, **kwargs):
        """Calls the top priority handler for the given `hook` with args/kwargs. If no handlers are available, throws
        PluginManager.HandlerNotAvailable
        """
        handlers = self.hooks(hook)
        if not handlers:
            raise self.HandlerNotAvailable
        return handlers[0][1]["handler"](*args, **kwargs)

    @classmethod
    def discover_plugins(cls, plugins_dir=None):
        """Dynamically discover and load plugins"""
        discovered_plugins = {
            name: importlib.import_module(name)
            for finder, name, ispkg in pkgutil.iter_modules()
            if name.startswith(cls.PACKAGE_PREFIX)
        }
        # TODO: also walk/load plugins in the given `plugins_dir`
        return discovered_plugins


########################################################################################################
# region singleton access methods
plugin_manager = PluginManager()
register_plugin = plugin_manager.register_plugin
unregister_plugin = plugin_manager.unregister_plugin
register_hook = plugin_manager.register_hook
unregister_hook = plugin_manager.unregister_hook


# endregion singleton access methods
########################################################################################################


def register(plugin: DataToolsPlugin):
    """Decorator to register a `DataToolsPlugin`

    @plugins.register
    class MyPlugin(DataToolsPlugin):
        ...

    """
    register_plugin(plugin)
    return plugin
