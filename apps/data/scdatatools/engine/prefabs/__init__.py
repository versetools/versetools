import logging
import typing
from typing import TYPE_CHECKING

from scdatatools.engine.model_utils import (
    Vector3D,
    Quaternion,
    vector_from_csv,
    quaternion_from_csv,
)
from scdatatools.p4k import P4KInfo
from scdatatools.sc.blueprints import Blueprint
from scdatatools.sc.blueprints.generators.prefab import blueprint_from_prefab_library
from scdatatools.utils import norm_path
from ..cryxml import dict_from_cryxml_file, camel_attr_to_snake

if TYPE_CHECKING:
    from scdatatools.sc import StarCitizen

logger = logging.getLogger(__name__)
PREFAB_OBJECT_TYPES_TO_PROCESS = {
    "AreaBox",
    "Brush",
    "Decal",    
    "GeomEntity",
    "Group",
    "Ledge",
    "LightBox",
    "Prefab",
    "ProceduralLayoutConnector",
    "ProceduralLayoutElementInfoBox",
    "ProceduralLayoutSecondaryElement",
    "Shape"
    # Ignored Types
    # 'AudioAreaAmbience', 'AudioTriggerSpot', "Designer", 'EnvironmentProbe', 'PrefabPivot', 'ParticleEffect', 'VisArea'
}
PREFAB_ENTITY_TYPES_TO_PROCESS = {
    "Light",
    "ObjectContainer",
    "Room"
    # Ignored Types
    # 'Ht_D_Int_Door_Double_A', 'FogVolume', 'GoToPointEntity', 'GravityBox', 'Railing_Straight_4m_Lowtech_Open',
}


def _clean_prefab_id(guid: str) -> str:
    """
    Takes an `Id` from a Prefab CryXmlB file and returns a cleaner version e.g.:
    `{457521F2-E4C8-4984-8AF8-29B668EDAB59}` -> `457521F2-E4C8-4984-8AF8-29B668EDAB59`

    If not detected as a Id, returns guid unchanged
    """
    if not isinstance(guid, str):
        logger.warning(f"Invalid GUID, should be a string, got {guid=!r}")
    elif guid and guid[0] == "{" and guid[-1] == "}":
        return guid[1:-1]
    return guid


class PrefabObject(dict):
    def __init__(self, prefab: "Prefab", **kwargs):
        super().__init__()
        self.prefab = prefab
        for k, v in kwargs.items():
            self[k] = v

        # GeomEntity objects already have ['geometry']
        if self.get("type") == "Brush":
            self["geometry"] = self["prefab"]
        elif self.get("type") == "Group":
            group_objs = self.get("objects", {}).get("Object", [])
            if isinstance(group_objs, dict):
                group_objs = [group_objs]
            self["objects"] = [PrefabObject(prefab, **_) for _ in group_objs[:] if _]

    def __setitem__(self, key, value):
        key = camel_attr_to_snake(key)
        if len(value) == 38 and value[0] == "{" and value[-1] == "}":
            value = _clean_prefab_id(value)
        super().__setitem__(key, value)


class Prefab:
    def __init__(
        self,
        name,
        guid,
        properties,
        library: "PrefabLibrary",
        lib_folders="",
        description="",
        category="",
        footprint="",
    ):
        self.name = name
        self.guid = guid
        self.library = library
        self.objects = {}
        self.anchors = {}
        self.pivots = {}
        self.layers = {}
        self.properties = properties
        self.lib_folders = lib_folders
        self.description = description
        self.category = category
        self.footprint = footprint

    @property
    def manager(self):
        return self.library.manager

    def objects_with_geometry(self, pos_offset=None, rotation_offset=None):
        """Generator for all objects within this prefab that contain geometry. This will recursively enter referenced
        prefabs as well, dynamically loading them if necessary"""

        def _walk_objs(objects, pos_off, rot_off):
            for obj in objects:
                if (ot := obj["type"]) in PREFAB_OBJECT_TYPES_TO_PROCESS:
                    if ot == "Prefab":
                        prefab_library = obj.get("prefab_name", "").split(".", maxsplit=1)[0]
                        if (
                            prefab := self.manager.prefab_for_id(obj["prefab_guid"], prefab_library)
                        ) is not None:
                            yield from prefab.objects_with_geometry(
                                pos_offset=pos_off + vector_from_csv(obj.get("pos", "0,0,0")),
                                rotation_offset=rot_off
                                * quaternion_from_csv(obj.get("rotate", "1,0,0,0")),
                            )
                    elif ot == "Brush":
                        yield {
                            "pos_offset": pos_off,
                            "rotation_offset": rot_off,
                            "object": obj,
                        }
                    elif ot == "Group":
                        yield from _walk_objs(
                            obj["objects"],
                            pos_off + vector_from_csv(obj.get("pos", "0,0,0")),
                            rot_off * quaternion_from_csv(obj.get("rotate", "1,0,0,0")),
                        )
                    else:
                        print(f'Unhandled object with geometry: {obj["type"]}')
                        continue

        yield from _walk_objs(
            self.objects.values(),
            pos_offset or Vector3D(0, 0, 0),
            rotation_offset or Quaternion(1, 0, 0, 0),
        )

    def generate_blueprint(self, monitor=None) -> Blueprint:
        return blueprint_from_prefab_library(self, monitor)

    @classmethod
    def from_dict(cls, library, prefab_dict) -> "Prefab":
        prefab = Prefab(
            prefab_dict["@Name"],
            _clean_prefab_id(prefab_dict["@Id"]),
            prefab_dict.get("Properties", {}),
            library,
            lib_folders=prefab_dict.get("@LibFolders", ""),
            description=prefab_dict.get("@Description"),
            category=prefab_dict.get("@Category", ""),
            footprint=prefab_dict.get("@Footprint", ""),
        )

        if isinstance(objects := prefab_dict.get("Objects", {}).get("Object", []), dict):
            objects = [objects]  # only one object in prefab

        for obj in objects:
            if obj := PrefabObject(prefab, **obj):
                prefab.objects[obj["name"]] = obj
                if "layer" in obj:
                    prefab.layers.setdefault(obj["layer"], []).append(obj)
                if obj["type"] == "PrefabAnchor":
                    assert obj["name"] not in prefab.anchors
                    prefab.anchors[obj["name"]] = obj
                elif obj["type"] == "PrefabPivot":
                    assert obj["name"] not in prefab.pivots
                    prefab.pivots[obj["name"]] = obj

        return prefab


class PrefabLibrary:
    def __init__(self, name, manager: "PrefabManager"):
        self.name = name
        self.manager = manager
        self.prefabs = {}
        self.prefabs_by_id = {}

    def generate_blueprint(self, monitor=None) -> Blueprint:
        return blueprint_from_prefab_library(self, monitor=monitor)

    def objects_with_geometry(self):
        """Generator for all objects within this prefab that contain geometry. This will recursively enter referenced
        prefabs as well, dynamically loading them if necessary"""
        for prefab in self.prefabs.values():
            yield from prefab.objects_with_geometry()

    @classmethod
    def from_prefab_cryxml(
        cls, manager, path_or_file: typing.Union[str, typing.IO]
    ) -> typing.Union["PrefabLibrary", None]:
        """
        Creates a new `PrefabLibrary` from a Prefab file in the Data.p4k

        :param manager: `PrefabManager` loading the Prefab
        :param path_or_file:  Path to the Prefab CryXmlB file in the data.p4k or a File like object
        :return: `Prefab` or None if `path_or_file` does not contain a PrefabLibrary
        """
        try:
            if isinstance(path_or_file, str):
                filename = path_or_file
                logger.debug(f"creating prefab {filename}")
                prefab_data = dict_from_cryxml_file(manager.sc.p4k.open(path_or_file))
            else:
                filename = path_or_file.name
                logger.debug(f"creating prefab {filename}")
                prefab_data = dict_from_cryxml_file(path_or_file)
        except Exception as e:
            logger.error(f"Could not load {filename}", exc_info=e)
            return None

        if "PrefabsLibrary" not in prefab_data:
            return None

        if isinstance(prefabs := prefab_data.get("PrefabsLibrary", {}).get("Prefab", []), dict):
            prefabs = [prefabs]

        lib = PrefabLibrary(prefab_data["PrefabsLibrary"]["@Name"], manager)
        lib.prefabs = {prefab.name: prefab for _ in prefabs if (prefab := Prefab.from_dict(lib, _))}
        lib.prefabs_by_id = {prefab.guid: prefab for prefab in lib.prefabs.values()}

        return lib


class PrefabManager:
    """The `PrefabManager` creates a central location to track and load CryEngine `Prefabs` from games files. Prefabs
    often include other Prefabs by name, creating the need to track them in a central store.
    """

    def __init__(self, sc: "StarCitizen"):
        self.sc = sc
        self.prefabs = {}
        self.libraries = {}

    def load_all_prefabs(self):
        """Load every Prefab library in Data.p4k"""
        for prefab_info in self.sc.p4k.search("Data/Prefabs/*"):
            self.load_prefab_library(prefab_info)

    def prefab_for_id(self, guid: str, library: str):
        """Return the loaded prefab object for the given guid, dynamically loading the given
        prefablibrary path from if necessary"""
        if guid in self.prefabs:
            return self.prefabs[guid]
        self.library_from_name(library)
        return self.prefabs.get(guid)

    def library_from_name(self, name) -> typing.Union[PrefabLibrary, None]:
        """
        Return the loaded PrefabLibrary from the given library name. If not already loaded this will attempt to load the
        library from the 'Data/Prefabs' path in the Data.p4k
        :param name: Prefab Library name
        :return: PrefabLibrary
        """
        name = norm_path(name.replace(".xml", "").lower())
        if name in self.libraries:
            return self.libraries[name]
        try:
            return self.load_prefab_library(self.sc.p4k.getinfo(f"Data/Prefabs/{name}.xml"))
        except KeyError:
            return None

    def load_prefab_library(self, prefab: typing.Union["P4KInfo", str]) -> PrefabLibrary:
        """
        Load the given `prefab` from the Data.p4k.
        :param prefab:
        :return:
        :raises:
            KeyError: If the prefab path is not found in the SC Data.p4k
        """

        if not isinstance(prefab, P4KInfo):
            prefab = self.sc.p4k.getinfo(prefab)

        prefab_name = norm_path(
            prefab.filename.replace("Data/Prefabs/", "").replace(".xml", "").lower()
        )
        if prefab_name not in self.libraries:
            lib = PrefabLibrary.from_prefab_cryxml(self, prefab.open())
            if lib is not None:
                self.libraries[norm_path(lib.name.lower())] = lib
                for prefab in lib.prefabs.values():
                    self.prefabs[prefab.guid] = prefab

        return self.libraries.get(prefab_name)
