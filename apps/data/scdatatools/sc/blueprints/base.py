import json
import logging
import typing
from contextlib import contextmanager
from pathlib import Path

import sentry_sdk
from pyquaternion import Quaternion

from scdatatools.engine.cryxml import dict_from_cryxml_file, CryXmlConversionFormat
from scdatatools.engine.model_utils import Vector3D
from scdatatools.forge.dco import DataCoreRecordObject
from scdatatools.forge.dco import dco_from_datacore
from scdatatools.forge.dco.entities import Vehicle
from scdatatools.forge.dftypes import Record, GUID
from scdatatools.utils import SCJSONEncoder
from scdatatools.utils import norm_path
from .extractor import extract_blueprint
from .processors import process_p4kfile, process_datacore_object
from .processors.datacore.entity_class import load_item_port

if typing.TYPE_CHECKING:
    from scdatatools.sc import StarCitizen

logger = logging.getLogger(__name__)
RECORDS_BASE_PATH = Path("libs/foundry/records/")


class BlueprintGeometry(dict):
    """
    A custom dictionary for storing information about a bit of geometry for a `Blueprint` (cgf/cga/skin/etc).  The
    `Geometry` object will be used to keep track of instances of the model in the scene, any sub-geometry that muse be
    included with this geometry, whether or not the geom has a loadout, and what those loadout components are, and what
    materials are required for the geometry.

    Typically this is created by using the `get_or_create_geometry` function of a `Blueprint`, as there should be one
    `Geometry` per geometry file.
    """

    def __init__(
            self,
            blueprint: "Blueprint",
            name,
            geom_file,
            pos=None,
            rotation=None,
            scale=None,
            materials=None,
            attrs=None,
            helpers=None,
            parent=None,
    ):
        super().__init__()
        self._blueprint = blueprint
        self["name"] = name
        self["geom_file"] = geom_file
        self["loadout"] = {}
        self["materials"] = set()
        self["sub_geometry"] = {}
        self["tint_palettes"] = set()
        self["helpers"] = helpers or {}
        self.add_materials(materials or [])
        if pos:
            self.add_instance("", pos, rotation, scale)
        self["attrs"] = attrs or {}
        self.parent = parent

    def add_materials(self, mats):
        # ensure material files have the correct suffix
        if not isinstance(mats, (list, tuple, set)):
            mats = [mats]
        self["materials"].update(
            Path(mat).with_suffix(".mtl").as_posix().lower() for mat in mats if mat
        )

    def add_instance(
            self,
            name,
            pos,
            rotation=None,
            scale=None,
            materials=None,
            attrs=None,
            soc: dict = None,
    ):
        if soc is not None:
            inst = soc.setdefault("instances", {}).setdefault(self["name"], {})
        else:
            inst = self._blueprint.current_container.setdefault("instances", {}).setdefault(
                self["name"], {}
            )
        if not name:
            name = str(len(inst))
        self.add_materials(materials or [])
        inst[name] = {
            "pos": pos,
            "rotation": rotation if rotation is not None else Quaternion(1, 0, 0, 0),
            "scale": scale or Vector3D(1, 1, 1),
            "materials": materials or [],
            "attrs": attrs or {},
        }

    def add_sub_geometry(self, child_geom, pos=None, rotation=None, attrs=None):
        create_params = {
            "pos": pos or {"x": 0.0, "y": 0.0, "z": 0.0},
            "rotation": rotation or {"x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0},
            "attrs": attrs or {},
        }
        if bone_name := create_params["attrs"].get("bone_name", ""):
            helper = self["helpers"].get(bone_name.lower(), {})
            if helper:
                create_params["pos"] = helper["pos"]
                create_params["rotation"] = helper["rotation"]
                create_params["attrs"]["bone_name"] = helper["name"]
        self["sub_geometry"].setdefault(child_geom["name"], []).append(create_params)

    def __hash__(self):
        return hash(tuple(self))


class Blueprint:
    def __init__(
            self,
            name,
            sc: "StarCitizen",
            monitor: typing.Callable = None,
            convert_cryxml_fmt: CryXmlConversionFormat = "xml",
    ):
        """
        Utility for generating a `StarCitizen Blueprint` (`.scbp`) file and extracting required assets for objects
        within the `Data.p4k`. `Blueprint`s are typically created by using the approriate `generator` function for the
        source object type, see `scdatatools.sc.blueprints.generators` for options.

        Once a `Blueprint` has been created, the `.scbp` file (a sepcific schema in JSON) is generated using
        `Blueprint.dumps`. The required data files are stored in `Blueprint.p4k_files`. `Blueprint.extract` is used to
        extract the required assets.

        :param name: Name of the `Blueprint`
        :param sc: The `StarCitizen` object to lookup information from
        :param monitor: The output log handling function the `Blueprint` will use in addition to `logging`
        :param convert_cryxml_fmt: The output format for DataCore records (json or xml)
        """
        self.name = name
        self.sc = sc
        self.monitor = monitor
        self.convert_cryxml_fmt = convert_cryxml_fmt

        self._entities_to_process = set()
        self._processed_containers = set()
        self._containers_to_process = {}
        self._processed_entities = set()
        self._container_for_path = {}
        self._container_for_record = {}
        self.record_geometry = {}
        self.converted_files = {}

        self._entity = None        
        self.entity_geom = ""
        self.asset_info = {"Starfab version": "0.4.9", "SC version": "unknown"}        
        self.p4k_files = set()
        self._extract_filter = set()
        self.hardpoints = {}
        self.geometry = {}
        self.socs = {}
        self.records = set()
        self.bone_names = set()
        self.tint_palettes = {}
        self.containers = {"base": self._empty_container()}
        self.current_container = self.containers["base"]

        self.sc.p4k.expand_subarchives()  # ensure all the subarchives are expanded/available

    @property
    def entity(self):
        return self._entity

    @entity.setter
    def entity(self, record):
        self._entity = record
        e = dco_from_datacore(self.sc, record)
        self.hardpoints = {hp: {} for hp in e.hardpoints.keys()} if isinstance(e, Vehicle) else {}

    @property
    def extract_filter(self) -> set:
        self._process()
        return self._extract_filter

    def extract(self, *args, **kwargs) -> list:
        """
        Extract the required assets for this `Blueprint`. See `extract_blueprint` for options.
        :return: List of the extracted file paths on disk
        """
        extract_opts = kwargs
        cur_monitor = self.monitor
        if "monitor" in extract_opts:
            self.monitor = extract_opts["monitor"]
        extract_opts.setdefault("monitor", self.log)

        try:
            self._process()
            return extract_blueprint(self, *args, **kwargs)
        finally:
            self.monitor = cur_monitor

    def to_dict(self, process=True):
        """Return the `Blueprint` as a dictionary"""
        if process:
            self._process()
        return {
            "name": self.name,
            "entity_geom": self.entity_geom,
            "socs": self.socs,
            "asset_info": self.asset_info,
            "bone_names": sorted(_ for _ in self.bone_names if _),
            "hardpoints": self.hardpoints,
            "geometry": {geom: self.geometry[geom] for geom in sorted(self.geometry)},
            "tint_palettes": []
            if not self.entity_geom
            else sorted(self.geometry[self.entity_geom]["tint_palettes"]),
            "containers": self.containers,
        }

    def dumps(self, indent=2, process=True, *args, **kwargs):
        """Dump the `Blueprint` to a `json` string"""
        if "cls" not in kwargs:
            kwargs["cls"] = SCJSONEncoder
        return json.dumps(self.to_dict(process=process), indent=indent, *args, **kwargs)

    def dump(self, fp, indent=2, process=True, *args, **kwargs):
        """Dump the `Blueprint` to the given file `fp` as `json`"""
        if "cls" not in kwargs:
            kwargs["cls"] = SCJSONEncoder
        return json.dump(self.to_dict(process=process), fp, indent=indent, *args, **kwargs)

    def log(self, msg, progress=None, total=None, level=logging.INFO, exc_info=None):
        """Internal logging tool that can be used by generators/processors as the bp is being processed. This will
        respsect the `monitor` that was configured for the `Blueprint`

        :param: Message to log
        :progress: The current progress (count out of total)
        :total: The expected progress total
        :level: logging level to log at (only used for the default monitor which is the logging module)
        :exc_info: `Exception` information that will be handled/passed in case of an exception
        """
        if self.monitor is not None:
            if level != logging.INFO:
                msg = f"{logging.getLevelName(level)}: {msg}"
            self.monitor(msg, progress=progress, total=total, level=level, exc_info=exc_info)
        if exc_info is not None:
            logger.exception(msg, exc_info=exc_info)
        else:
            logger.log(level, msg)

    def add_material(self, path: typing.Union[str, Path], model_path: str = "") -> str:
        """Adds a material file to be processed, trying to determine the mtl's path if it is not an absolute path
        within the p4k. If the mtl is associated with a model, and model path is specified it will search for the mtl
        relative to that path as well.

        :path: path of the mtl to add
        :model_path: path of the associated model
        :returns: `str` of the path that was found and added for extraction, or an empty string if it could not be found
        """
        if not path:
            return ""
        mat = Path(path)
        if mat.parent.parent == mat.parent and model_path:
            # material is a path local to the model
            mat = Path(model_path).parent / mat
            if mat.as_posix().lower() not in self.sc.p4k.NameToInfoLower:
                # material is a path in the `textures` directory next to the model?
                mat = Path(model_path).parent / "textures" / path
                if mat.as_posix().lower() not in self.sc.p4k.NameToInfoLower:
                    self.log(f'Could not find path for material "{path}')
                    return ""
        return self.add_file_to_extract(mat.with_suffix(".mtl")).replace("data/", "")

    def add_container(self, path, attrs):
        if path not in self._processed_containers:
            self._containers_to_process.setdefault(path, attrs)
            self.add_file_to_extract(path, no_process=True)

    def add_file_to_extract(
            self, path: typing.Union[str, list, tuple, set, Path], no_process=False
    ) -> str:
        """Add an additional file to be extracted from the Data.p4k

        :param path: Path (or list of paths) of the file within the `Data.p4k`
        :returns: `str` of the path that is being tracked or '' if path could not be determined
        """
        if not path:
            return ""
        if isinstance(path, (list, tuple, set)):
            for p in path:
                self.add_file_to_extract(p)
            return ""
        elif isinstance(path, Path):
            path = path.as_posix()
        path = path.lower()

        path = norm_path(f'{"" if path.startswith("data") else "data/"}{path}')
        if "." not in path:
            # add whole dir
            if path not in self._extract_filter:
                self._extract_filter.add(path)
                self.log(f"+ dir ex: {path}")
        else:
            base, ext = path.split(".", maxsplit=1)
            if path in self.sc.p4k.NameToInfoLower:
                if path not in self.p4k_files:
                    self.p4k_files.add(path)
                    self._extract_filter.add(base)
                    self.log(f"+ file ex: {path}")
                    self._container_for_path[path] = self.current_container
                    if not no_process:
                        self._entities_to_process.add(("path", path))
            elif base in self.sc.p4k.BaseNameToInfo:
                return self.add_file_to_extract(
                    [_.filename for _ in self.sc.p4k.BaseNameToInfo[base]], no_process
                )
            else:
                if base.endswith("disp"):
                    # a lot of textures miss the 'l' at the end of the file... may as well catch them
                    base += "l"
                    if base in self.sc.p4k.BaseNameToInfo:
                        return self.add_file_to_extract(
                            [_.filename for _ in self.sc.p4k.BaseNameToInfo[base]]
                        )
                self.log(f"could not find file in P4K: {path}", logging.WARNING)
                return ""
        return path

    def add_record_to_extract(self, guid: typing.Union[str, list, tuple, set, GUID]):
        """Add an additional datacore record to be processed/extracted.

        :param guid: GUID (or list of GUIDs) to be processed/extracted
        """

        if not guid:
            return
        if isinstance(guid, (list, tuple, set)):
            for g in guid:
                self.add_record_to_extract(g)
            return

        guid = str(guid)

        if guid not in self.sc.datacore.records_by_guid:
            return self.log(f"record {guid} does not exist", logging.WARNING)

        if guid not in self.records:
            record = self.sc.datacore.records_by_guid[guid]
            self.log(f"+ record: {Path(record.filename).relative_to(RECORDS_BASE_PATH).as_posix()}")
            self.records.add(guid)
            self._entities_to_process.add(("record", guid))
            self._container_for_record[guid] = self.current_container
            outrec = (Path("Data") / record.filename).with_suffix(f".{self.convert_cryxml_fmt}")
            if self.convert_cryxml_fmt == "xml":
                self.converted_files[outrec] = record.dcb.dump_record_xml(record)
            else:
                self.converted_files[outrec] = record.dcb.dump_record_json(record)

    def get_or_create_item_port(self, name: str, parent: dict) -> dict:
        """Gets or creates an `item_port` loadout configuration for a `loadout` `parent`.

        :param name: name of the item_port (key name)
        :param parent: The `parent` `loadout` within a `BlueprintGeometry`
        :returns: `dict` of the `loadout` named `name` in the `parent` loadout
        """
        if name in self.hardpoints:
            if name not in parent:
                parent[name] = {"hardpoint": name}
            parent = self.hardpoints

        if not parent.get(name, {}):
            parent[name] = {"geometry": set()}
        return parent[name]

    def update_hardpoint(self, name: str, record: typing.Union[str, GUID, Record, None]):
        del self.hardpoints[name]  # trigger key error if it doesnt exist
        self.hardpoints[name] = {}
        if record is not None:
            return load_item_port(self, name, record)

    def get_or_create_geom(
            self,
            geom_path: typing.Union[str, Path],
            parent: BlueprintGeometry = None,
            create_params: dict = None,
            sub_geometry: dict = None,
    ) -> typing.Tuple[BlueprintGeometry, bool]:
        """
        Gets, or creates, the `BlueprintGeometry` for `geom_path` within the `Blueprint`

        :param geom_path: Path of the geometry model file in the p4k
        :param parent: The parent `BlueprintGeometry` to use if the geometry must be created
        :param create_params: `dict` of additional parameters to pass to `BlueprintGeometry` if it is being created
        :param sub_geometry: `dict` of sub-geometry to also create and add to the new geometry if it is being created
        :returns: `tuple` of the `BlueprintGeometry` and a `bool` of whether or not the geometry was just created
        """
        if not geom_path:
            return None, False

        if not isinstance(geom_path, Path):
            geom_path = Path(geom_path)

        created = False
        sub_geometry = sub_geometry or {}
        if not isinstance(geom_path, Path):
            geom_path = Path(geom_path)

        self.add_file_to_extract(geom_path)

        if geom_path.suffix.lower() == ".cdf":
            # parse the cdf and create it's sub_geometry as well
            try:
                p4k_path = (
                    (Path("data") / geom_path)
                    if geom_path.parts[0].lower() != "data"
                    else geom_path
                )
                p4k_info = self.sc.p4k.NameToInfoLower[p4k_path.as_posix().lower()]
                cdf = dict_from_cryxml_file(self.sc.p4k.open(p4k_info))["CharacterDefinition"]
                geom_path = Path(cdf["Model"]["@File"])
                attachments = cdf["AttachmentList"]["Attachment"]
                if isinstance(attachments, dict):
                    attachments = [attachments]  # happens if there is only one attachment
                # TODO: handle attachment points that don't have geometry (doesn't have a @Binding)
                sub_geometry.update(
                    {
                        _["@Binding"]: {"attrs": {"bone_name": _["@AName"]}}
                        for _ in attachments
                        if "@Binding" in _
                    }
                )
            except KeyError:
                self.log(f"failed to parse cdf: {geom_path}", logging.ERROR)
                return None, False

        if geom_path.suffix.lower() == ".cgf":
            # check to see if there is a cga equivalent, and use that instead
            test_path = (
                (Path("data") / geom_path) if geom_path.parts[0].lower() != "data" else geom_path
            )
            if test_path.with_suffix(".cga").as_posix().lower() in self.sc.p4k.NameToInfoLower:
                geom_path = geom_path.with_suffix(".cga")

        geom_name = geom_path.as_posix().lower()
        if geom_path.parts[0].lower() == "data":
            geom_name = geom_name[5:]
            geom_path = Path(*geom_path.parts[1:])

        if parent is not None:
            child_geom, _ = self.get_or_create_geom(geom_path, create_params=create_params)
            parent.add_sub_geometry(child_geom, **create_params)
            return parent, True

        geom_path = norm_path(geom_path.as_posix())

        if geom_name not in self.geometry:
            geom_name = norm_path(geom_name)
            self.geometry[geom_name] = BlueprintGeometry(
                self, name=geom_name, geom_file=geom_path, **(create_params or {})
            )
            for sub_geo, sub_params in sub_geometry.items():
                self.get_or_create_geom(sub_geo, self.geometry[geom_name], sub_params)
            created = True

        return self.geometry[geom_name], created

    def get_or_create_soc(self, soc_path: typing.Union[str, Path]):
        """
        Gets, or creates, the `soc` for `soc_path`

        :param soc_path: Name of the soc file (usually it's path)
        :returns: `tuple` of the `soc` dict and a `bool` of whether or not the soc was just created
        """
        if soc_path in self.socs:
            return self.socs[soc_path], False
        self.socs[soc_path] = {
            "instances": {},
            "lights": {},
        }
        return self.socs[soc_path], True

    def geometry_for_record(
            self,
            record: typing.Union[DataCoreRecordObject, Record, GUID, str],
            base: bool = False,
    ) -> typing.Union[typing.Dict[str, BlueprintGeometry], BlueprintGeometry, None]:
        """Returns all the `BlueprintGeometry`s associated with a given `record`.

        > If the `record` has not been processed yet, this will at least `process_geometry_resource_params` for the
        > the `record` causing its geometry to load just in time

        :param record: `DataCoreObject`, `Record` or `GUID` of the record
        :param base: If true, only the base geometry for the record will be returned (none of the tagged versions)
        :returns: `dict` of the `BlueprintGeometry` objects for the `record` where they key names are the `tag` name
            of the geometry file, '' being the base model. If the record, or no geometry could be found, returns None

        """
        if record is None:
            return None
        if isinstance(record, DataCoreRecordObject):
            guid = record.guid
        elif isinstance(record, Record):
            guid = record.id.value
        else:
            guid = record
        self.add_record_to_extract(
            guid
        )  # make sure the record has been tracked at least at some point
        if guid not in self.record_geometry:
            from scdatatools.sc.blueprints.processors.datacore import (
                process_geometry_resource_params,
            )

            record = self.sc.datacore.records_by_guid[guid]
            try:
                geom_component = next(
                    iter(
                        _
                        for _ in record.properties["Components"]
                        if _.type == "SGeometryResourceParams"
                    )
                )
                process_geometry_resource_params(self, geom_component, record)
                # ent_pro = ('record', guid)
                # if ent_pro in self._entities_to_process:
                #     self._entities_to_process.remove(ent_pro)
            except StopIteration:
                pass  # no geometry component for record
        geom = self.record_geometry.get(guid, {})
        if base and geom:
            if "" in geom:
                return next(iter(geom[""]))
            logger.warning(f"TODO: figure out missing base geometry situation")
            return None  # TODO: figure out what causes this situation
        return geom

    @staticmethod
    def _empty_container(attrs: dict = None):
        """The basis for an empty container. Containers are created on request"""
        return {
            "containers": {},
            "socs": [],
            "lights": {},
            "instances": {},
            "attrs": attrs or {},
        }

    def container(self, name) -> typing.Union[dict, None]:
        """Return the container (`dict`) from its dotted notation name, e.g. `base.base_int_body_main`
        :param name: Full name of the container in dotted notation
        :returns: The container (`dict`), or None if it does not exist
        """
        cont = self.containers["base"]
        while "." in name:
            base, name = name.split(".", maxsplit=1)
            if (cont := cont.get("containers", {}).get(base, None)) is None:
                return None
        return cont.get("containers", {}).get(name)

    @contextmanager
    def set_current_container(self, container: typing.Union[str, dict], attrs: dict = None):
        """Context manager used to scope the `current_container` while building up the `Blueprint`

        with current_container('base.base_int_body_main'):
            ... added geometry, files, etc. will be stored within the `base.base_int_body_main` container

        :param container: `str` representation of the container path (dotted notation), or the `dict` of the container
            itself
        :param attrs: `dict` of additional attributes for the container
        """
        previous_container = self.current_container
        try:
            if isinstance(container, str):
                if "." in container:
                    container, sub = container.split(".", maxsplit=1)
                    self.current_container = previous_container.setdefault(
                        "containers", {}
                    ).setdefault(container, self._empty_container(attrs))
                    with self.set_current_container(sub) as cont:
                        yield cont
                    return

                self.current_container = previous_container.setdefault("containers", {}).setdefault(
                    container, self._empty_container(attrs)
                )
            else:
                self.current_container = container
            yield self.current_container
        finally:
            self.current_container = previous_container

    def _process_record(self, record_guid, *args, **kwargs):
        try:
            process_datacore_object(
                self, self.sc.datacore.records_by_guid[record_guid], *args, **kwargs
            )
        except Exception as e:
            self.log(f"processing record {record_guid}: {e}", logging.ERROR, exc_info=e)
            raise

    def _process_p4k_file(self, path):
        try:
            process_p4kfile(self, path)
        except Exception as e:
            self.log(f"processing {path}: {e}", logging.ERROR, exc_info=e)
            raise

    def _process(self, limit_processing=-1, skip_ocs=False):
        """Process any files/records that are waiting to be processed until the list is empty"""
        from .generators.object_containers import blueprint_from_socpak

        sentry_sdk.set_context("blueprint", {"name": self.name})
        while self._entities_to_process or self._containers_to_process:
            if not skip_ocs and self._containers_to_process:
                # if there are containers to process, process the next one
                # TODO: this is a temporary migratory solution
                #       ^ does anyone remember what this fool was talking about? - vent
                container = next(iter(self._containers_to_process))
                attrs = self._containers_to_process.pop(container)
                if container not in self._processed_containers:
                    self._processed_containers.add(container)
                    try:
                        blueprint_from_socpak(sc=self.sc, bp=self, **attrs)
                    except Exception as e:
                        self.log(
                            f'failed to process object container "{container}"',
                            exc_info=e,
                        )

            cur_entities_to_process = self._entities_to_process - self._processed_entities
            if limit_processing == 0 or (skip_ocs and not cur_entities_to_process):
                break

            self._entities_to_process = set()
            for ent_type, entity in cur_entities_to_process:
                sentry_sdk.set_context(
                    "blueprint.processing", {"entity_type": ent_type, "entity": entity}
                )
                if ent_type == "record":
                    with self.set_current_container(self._container_for_record[entity]):
                        self._process_record(
                            entity
                        )  # processed records can add more records to process
                else:
                    with self.set_current_container(self._container_for_path[entity]):
                        self._process_p4k_file(
                            entity
                        )  # processed files could add more files to process
            self._processed_entities |= cur_entities_to_process
            limit_processing -= 1
