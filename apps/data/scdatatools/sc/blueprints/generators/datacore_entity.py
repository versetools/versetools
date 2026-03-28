import logging
import typing

from scdatatools.forge.dco import DataCoreRecordObject
from scdatatools.forge.dftypes import Record
from scdatatools.sc.blueprints.base import Blueprint

logger = logging.getLogger(__name__)

if typing.TYPE_CHECKING:
    from scdatatools import StarCitizen


def blueprint_from_datacore_entity(
    sc: "StarCitizen",
    record_or_guid: typing.Union[Record, DataCoreRecordObject, str],
    bp: Blueprint = None,
    monitor: typing.Callable = None,
) -> "Blueprint":
    """
    Generates a `Blueprint` which can be used to extract and import the assets referenced from a specific
    `EntityClassDefinition` from a `DataCoreBinary`.

    :param sc: `StarCitizen` instance to search for data.
    :param record_or_guid: `str` GUID of the record in the `DataCoreBinary`, or the record itself
        (as a `Record` or `DataCoreObject`)
    :param bp: Optionally add the entity to the given `Blueprint`, otherwise a new Blueprint will be
        created. When adding to a `Blueprint`, the entity will be added to whatever the current `container` is selected
        for in the `Blueprint`
    :param monitor: The output log handling function Blueprint will use in addition to `logging`
    :return: `Blueprint`
    """
    if isinstance(record_or_guid, str):
        record = sc.datacore.records_by_guid[record_or_guid]
    elif isinstance(record_or_guid, DataCoreRecordObject):
        record = record_or_guid.record
    else:
        record = record_or_guid
    assert record.type == "EntityClassDefinition"

    processs = False
    if bp is None:
        processs = True
        bp = Blueprint(record.name, sc, monitor=monitor)
        bp.entity = record

    bp.log(f"process datacore entity: {record.name}")
    bp.add_record_to_extract(record.id)

    if processs:
        bp._process(limit_processing=1, skip_ocs=True)

    return bp
