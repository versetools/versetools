import typing
from xml.etree import ElementTree

from scdatatools.engine.cryxml import (
    dict_from_cryxml_string,
    is_cryxmlb_file,
    etree_from_cryxml_file,
)
from scdatatools.sc.blueprints.common import RECORD_KEYS_WITH_PATHS
from scdatatools.sc.blueprints.processors import filetype_processor
from scdatatools.utils import etree_to_dict, dict_search

if typing.TYPE_CHECKING:
    from scdatatools.p4k import P4KInfo
    from scdatatools.sc.blueprints import Blueprint


@filetype_processor("adb")
def process_animation_db(bp: "Blueprint", path: str, p4k_info: "P4KInfo", *args, **kwargs) -> bool:
    etree = etree_from_cryxml_file(bp.sc.p4k.open(p4k_info))
    bp.add_file_to_extract(set(etree.getroot().attrib.values()))
    return True


@filetype_processor("mtl")
def process_mtl(bp: "Blueprint", path: str, p4k_info: "P4KInfo", *args, **kwargs) -> bool:
    """Collects all Texture.File paths from a mtl"""
    etree = etree_from_cryxml_file(bp.sc.p4k.open(p4k_info))
    bp.add_file_to_extract(set(_.attrib["File"] for _ in etree.findall(".//Texture")))
    bp.add_file_to_extract(set(_.attrib["Path"] for _ in etree.findall(".//Layer")))
    bp.add_file_to_extract(set(_.attrib["File"] for _ in etree.findall(".//MatRef")))
    return True


@filetype_processor("xml", "chrparams", "entxml", "rmp", "animevents", "cdf")
def xml_key_search(bp: "Blueprint", path: str, p4k_info: "P4KInfo", *args, **kwargs) -> bool:
    """Fallback xml handler that searches for known keys with asset paths in them"""
    raw = bp.sc.p4k.open(p4k_info).read()
    if p4k_info.filename.lower().endswith("_editor.xml"):
        return True  # found in socpaks, doesnt include anything useful from the client side
    x = (
        dict_from_cryxml_string(raw)
        if is_cryxmlb_file(raw)
        else etree_to_dict(ElementTree.fromstring(raw))
    )
    bp.add_file_to_extract(dict_search(x, RECORD_KEYS_WITH_PATHS, ignore_case=True))
    return True
