import logging
import typing
from pathlib import Path
from xml.etree import ElementTree

from scdatatools.engine.cryxml import (
    etree_from_cryxml_file,
    is_cryxmlb_file,
)
from scdatatools.p4k import P4KInfo
from scdatatools.utils import search_for_data_dir_in_path
from .mat_utils import normalize_material_name

logger = logging.getLogger(__name__)


class MaterialLibrary:
    def __init__(self, mtl: typing.Union[str, Path, typing.IO, P4KInfo], data_dir=None):
        """
        Parses and creates all missing materials defined in a StarCitizen `mtl` file.

        :param mtl: The mtl path or `file`.
        """

        self._p4k = None
        self.data_dir = data_dir

        if isinstance(mtl, (str, Path)):
            self.mtl_path = Path(mtl)
            mtl = self.mtl_path.open("rb")
        elif isinstance(mtl, P4KInfo):
            self._p4k = mtl.p4k
            self.mtl_path = Path(mtl.filename)
            mtl = mtl.open()
        else:
            self.mtl_path = Path(mtl.name)

        if self._p4k is None and not self.data_dir:
            # Try to find the Base Dir as a parent of xml_path
            self.data_dir = search_for_data_dir_in_path(self.mtl_path)
            if not self.data_dir:
                self.data_dir = self.mtl_path.parent
                logger.debugscbp(
                    f"could not determine data_dir from mtl path. defaulting to mtl directory %s",
                    self.data_dir,
                )

        try:
            if is_cryxmlb_file(mtl):
                et = etree_from_cryxml_file(mtl)
            else:
                et = ElementTree.parse(mtl, parser=ElementTree.XMLParser(encoding="utf-8"))
        except Exception as e:
            logger.error(f"could not load material {self.mtl_path}", exc_info=e)
            raise

        self.materials = []
        for mat in et.findall(".//Material"):
            attrs = mat.attrib
            if "Name" not in attrs:
                attrs["Name"] = self.mtl_path.stem
            attrs["PrefixedName"] = f'{self.mtl_path.stem}_mtl_{attrs["Name"]}'
            attrs["NormalizedName"] = normalize_material_name(attrs["PrefixedName"])
            for subelement in mat:
                attrs[subelement.tag] = subelement
            self.materials.append(attrs)
