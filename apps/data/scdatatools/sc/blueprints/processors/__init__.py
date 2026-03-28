import logging
import typing

if typing.TYPE_CHECKING:
    from scdatatools.sc.blueprints import Blueprint
    from scdatatools.forge.dftypes import DataCoreBase


IGNORED_FILETYPES = ["dds", "tif", "socpak", "brmp", "obj", "altg"]


class BluePrintProcessorManager:
    """Manages processors for `filetypes`. This class should be accessed via `process_manager` singleton defined in
    `scdatatools.sc.blueprints.processors.process_manager`
    """

    def __init__(self):
        self._processors_for_filetype = {}
        self._processors_for_datacore_type = {}
        self._auto_loaded = False

    def _check_loaded(self):
        # TODO: this is a quick hack to auto-register things, we'll make it better
        if not self._auto_loaded:
            from .p4k import process_gfx, process_chunked_file, xml_key_search
            from .datacore import process_entity_class
        self._auto_loaded = True

    def processors_for_filetype(self, filetype: str) -> typing.List[typing.Callable]:
        return self._processors_for_filetype.setdefault(filetype, [])

    def processors_for_datacore_type(self, record_type: str) -> typing.List[typing.Callable]:
        return self._processors_for_datacore_type.setdefault(record_type, [])

    def register_filetype_processor(
        self,
        filetype: typing.Union[str, typing.List[str]],
        processor: typing.Callable,
        index: int = -1,
    ) -> typing.Callable:
        """Register the given `processor` for the given `filetype` (or list of filetypes) at `index`
        :param filetype: `str` of the filetype (e.g. 'xml')
        :param processor: Processor to be called to process a file matching `filetype`
        :param index: Index to insert the `processor` into list of processors for `filetype`. Defaults to appending
        """
        filetypes = [filetype] if isinstance(filetype, str) else filetype
        for filetype in filetypes:
            if index == -1:
                self._processors_for_filetype.setdefault(filetype, []).append(processor)
            else:
                self._processors_for_filetype.setdefault(filetype, []).insert(index, processor)
        return processor

    def unregister_filetype_processor(self, filetype, processor):
        self.processors_for_filetype(filetype).remove(processor)

    def register_datacore_type_processor(
        self,
        datacore_type: typing.Union[str, typing.List[str]],
        processor: typing.Callable,
        index: int = -1,
    ) -> typing.Callable:
        """Register the given `processor` for the given `datacore_type` (or list of datacore_types) at `index`
        :param datacore_type: `str` of the record_type (e.g. 'ShipEntity')
        :param processor: Processor to be called to process a file matching `record_type`
        :param index: Index to insert the `processor` into list of processors for `record_type`. Defaults to appending
        """
        datacore_types = [datacore_type] if isinstance(datacore_type, str) else datacore_type
        for datacore_type in datacore_types:
            if index == -1:
                self._processors_for_datacore_type.setdefault(datacore_type, []).append(processor)
            else:
                self._processors_for_datacore_type.setdefault(datacore_type, []).insert(
                    index, processor
                )
        return processor

    def unregister_datacore_type_processor(self, record_type, processor):
        self.processors_for_datacore_type(record_type).remove(processor)

    def process_p4kfile(self, blueprint: "Blueprint", path: str, *args, **kwargs) -> bool:
        """Processes the given path/p4k_info for `Blueprint` using the appropriate processor for `filetype`.

        Multiple processors for a `filetype` may be registered, and each one will be tried in turn until one is
        successful (returns `True`).

        :returns: `bool` whether or not the path was processed successfully
        """
        self._check_loaded()
        filetype = path.split(".", maxsplit=1)[1]

        try:
            p4k_info = blueprint.sc.p4k.getinfo(path)
        except KeyError:
            blueprint.log(
                f"Cant find p4k file to process, how did we get here? {path}",
                logging.ERROR,
            )
            return False

        if (
            filetype not in self._processors_for_filetype
            and filetype.split(".")[0] not in IGNORED_FILETYPES
        ):
            blueprint.log(f"unhandled p4k file: {path}", logging.WARNING)
            return False

        for processor in self.processors_for_filetype(filetype):
            if processor(blueprint, path, p4k_info, *args, **kwargs):
                blueprint.log(f"process: ({filetype}) {p4k_info.filename}")
                return True

    def process_datacore_object(
        self, blueprint: "Blueprint", object: "DataCoreBase", *args, **kwargs
    ) -> bool:
        """Processes the given `object` for `Blueprint` using the appropriate processor for its `type`.

        Multiple processors for a `datacore_type` may be registered, and each one will be tried in turn until one is
        successful (returns `True`).

        :param blueprint: `Blueprint` the object will be processed into
        :param object: The `object` from a `DataCoreBinary`
        :returns: `bool` whether or not the path was processed successfully
        """
        self._check_loaded()

        if object.type not in self._processors_for_datacore_type:
            # blueprint.log(f'unhandled datacore object "{object}" of type "{object.type}"', logging.DEBUG)
            return False

        for processor in self.processors_for_datacore_type(object.type):
            if processor(blueprint, object, *args, **kwargs):
                # blueprint.log(f'process datacore object: {object}', logging.DEBUG)
                return True


########################################################################################################
# region singleton access methods
processor_manager = BluePrintProcessorManager()
processors_for_filetype = processor_manager.processors_for_filetype
unregister_filetype_processor = processor_manager.unregister_filetype_processor
register_filetype_processor = processor_manager.register_filetype_processor
process_p4kfile = processor_manager.process_p4kfile

processors_for_datacore_type = processor_manager.processors_for_datacore_type
unregister_datacore_type_processor = processor_manager.unregister_datacore_type_processor
register_datacore_type_processor = processor_manager.register_datacore_type_processor
process_datacore_object = processor_manager.process_datacore_object
# endregion singleton access methods
########################################################################################################


def filetype_processor(*filetypes, index=-1):
    """Decorator to register filetype processors

    @filetype_processor('xml', 'entxml', 'cryxml')
    def xml_processor(bp, path):
        ...

    """

    def do_register(func):
        global processor_manager
        return processor_manager.register_filetype_processor(filetypes, func, index)

    return do_register


def datacore_type_processor(*datacore_types, index=-1):
    """Decorator to register datacore_type processors

    @datacore_type_processor('ShipInsuranceRecord', 'ShipInsurancePolicyRecord')
    def ship_insurance_processor(bp, object, *args, **kwargs):
        ...

    """

    def do_register(func):
        global processor_manager
        return processor_manager.register_datacore_type_processor(datacore_types, func, index)

    return do_register
