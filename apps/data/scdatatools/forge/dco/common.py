import re
import typing

from scdatatools.forge.dftypes import GUID, Record, StrongPointer, StructureInstance

if typing.TYPE_CHECKING:
    from scdatatools.sc import StarCitizen


RECORD_HANDLER = {}
STRONG_POINTER_HANDLER = {}
STRUCTURE_INSTANCE_HANDLER = {}


def register_record_handler(dco_type, filename_match=".*"):
    """
    Registers a class handler for the specified `dco_type`.

    Optionally a `filename_match` can be supplied to allow for more specific record handling, e.g. an
    `EntityClassDefinition` type with `spaceships` in the filename could resolve to a :class:`Ship` class instead of
    the base :class:`Entity` class. `filename_match` should be a valid regex.

    This should be used as a decorator for a sub-class of `DataCoreObject`
    """

    def _record_handler_wrapper(handler_class):
        RECORD_HANDLER.setdefault(dco_type, {})[filename_match] = handler_class
        return handler_class

    return _record_handler_wrapper


def register_strong_pointer_handler(dco_type):
    """
    Registers a class handler for the specified `dco_type`.
    """

    def _record_handler_wrapper(handler_class):
        if dco_type in STRONG_POINTER_HANDLER:
            raise Exception(f'Handler already defined for {handler_class}')
        STRONG_POINTER_HANDLER[dco_type] = handler_class
        return handler_class
    return _record_handler_wrapper


def register_structure_instance_handler(dco_type):
    """
    Registers a class handler for the specified `dco_type`.
    """

    def _record_handler_wrapper(handler_class):
        if dco_type in STRUCTURE_INSTANCE_HANDLER:
            raise Exception(f'Handler already defined for {handler_class}')
        STRUCTURE_INSTANCE_HANDLER[dco_type] = handler_class
        return handler_class
    return _record_handler_wrapper


def dco_from_datacore(sc: "StarCitizen", object: typing.Union[Record, StrongPointer]) -> typing.Any:
    if isinstance(object, Record):
        matched = {"": DataCoreRecordObject}
        if object.type in RECORD_HANDLER:
            # find every matching record handler and store them
            for check in sorted(RECORD_HANDLER[object.type], key=len, reverse=True):
                if re.match(check, object.filename):
                    matched[check] = RECORD_HANDLER[object.type][check]

        # use the record handler with the most specific (longest) filename check
        return matched[sorted(matched, key=len, reverse=True)[0]](sc, object)
    elif isinstance(object, StrongPointer):
        return STRONG_POINTER_HANDLER.get(object.type, DataCoreObject)(sc, object)
    elif isinstance(object, StructureInstance):
        return STRUCTURE_INSTANCE_HANDLER.get(object.type, DataCoreObject)(sc, object)
    return object


def dco_from_guid(sc: "StarCitizen", record: typing.Union[str, GUID, Record, StrongPointer]) -> typing.Any:
    """
    Takes a :str:`guid` and returns a :class:`DataCoreObject` created from the proper DCO subclass for the record type
    """
    if not isinstance(record, Record):
        record = sc.datacore.records_by_guid[str(record)]
    return dco_from_datacore(sc, record)


class DataCoreObject:
    def __init__(self, sc: "StarCitizen", object: typing.Union[Record, StrongPointer, StructureInstance]):
        self._sc = sc
        self._datacore = sc.datacore
        self.object = object

    @property
    def properties(self):
        return self.object.properties
        # return {k: dco_from_datacore(self._datacore, v) for k, v in self.object.properties.items()}

    def __getattr__(self, item):
        return self.properties[item]

    @property
    def name(self):
        return self.object.name

    @property
    def type(self):
        return self.object.type


class DataCoreRecordObject(DataCoreObject):
    """
    A handy Python representation of a :class:`Record` from a `DataForge`. This base class is subclassed with
    record `type` specific classes that have more convenience functionality for those specific types. The preferred
    method to create a :class:`DataCoreObject` is to the use the :func:`dco_from_guid` function, which will
    automagically use the correct subclass for the :class:`Record` type.
    """

    @property
    def guid(self):
        return self.object.id.value

    @property
    def filename(self):
        return self.object.filename

    def to_dict(self, depth=100):
        return self.object.dcb.record_to_dict(self.object, depth=depth)

    def to_json(self, depth=100):
        return self.object.dcb.dump_record_json(self.object, depth=depth)

    def to_etree(self, depth=100):
        return self.object.dcb.record_to_etree(self.object, depth=depth)

    def to_xml(self, depth=100):
        return self.object.dcb.dump_record_xml(self.object, depth=depth)
