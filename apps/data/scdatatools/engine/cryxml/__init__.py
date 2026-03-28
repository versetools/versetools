"""
A suite of utilities for converting binary CryXMLB files to XML :class:`ElementTrees` or to a :py:obj:`dict`.

References:
  - https://github.com/aws/lumberyard/blob/0b34452ef270f6b27896858dc7899c9796efb124/dev/Code/CryEngine/CryCommon/XMLBinaryHeaders.h
  - https://github.com/aws/lumberyard/blob/master/dev/Code/CryEngine/CrySystem/XML/XMLBinaryReader.cpp
  - https://github.com/dolkensp/unp4k/blob/master/src/unforge/CryXmlB/CryXmlSerializer.cs
"""

__all__ = [
    "CryXMLBParser",
    "CryXmlConversionFormat",
    "pprint_xml_tree",
    "etree_from_cryxml_file",
    "dict_from_cryxml_file",
    "etree_from_cryxml_string",
    "dict_from_cryxml_string",
    "camel_attr_to_snake",
    "is_cryxmlb_file",
]

import enum
import json
import logging
import re
import typing
from ctypes import sizeof
from pathlib import Path
from xml.etree import ElementTree
from xml.etree.ElementTree import TreeBuilder, ParseError, XMLParser

from scdatatools import plugins
from scdatatools.engine.cryxml.defs import (
    CryXMLBHeader,
    CryXMLBNodeIndex,
    CryXMLBNode,
    CryXMLBAttribute,
    CRYXML_NO_PARENT,
)
from scdatatools.engine.cryxml.utils import pprint_xml_tree
from scdatatools.engine.materials.mat_utils import normalize_material_name
from scdatatools.p4k import monitor_msg_from_info, P4KInfo
from scdatatools.utils import etree_to_dict

logger = logging.getLogger(__name__)
CRYXMLB_SIGNATURE = b"CryXmlB"
CRYXMLB_EXTENSIONS = ["xml", "mtl", "chrparams", "entxml", "rmp", "animevents", "adb"]


class CryXmlConversionFormat(enum.Enum):
    xml = "xml"
    json = "json"


class _StandardXmlFile(Exception):
    pass


class _CryXMLBParser:
    """Parsers a CryXMLB file"""

    def __init__(self, target, encoding="UTF-8"):
        self.target = target

        self.StartElementHandler = None
        self.EndElementHandler = None
        self.StartNamespaceDeclHandler = None
        self.EndNamespaceDeclHandler = None
        self.CharacterDataHandler = None
        self.CommentHandler = None
        self.ProcessingInstructionHandler = None

        self.encoding = encoding
        self._data = None
        self._header = None

        self._nodes = []
        self._attributes = []
        self._child_indices = []

    def _read_string(self, offset):
        if self._header is None or self._data is None:
            return None
        offset = self._header.string_data_offset + offset
        s = self._data[
            offset : self._data.index(
                b"\x00",
                offset,
                self._header.string_data_offset + self._header.string_data_size,
            )
        ]
        return s.decode(self.encoding)

    def _read_node(self, index):
        if len(self._nodes) > index:
            return self._nodes[index]
        offset = self._header.node_table_offset + index * sizeof(CryXMLBNode)
        node = CryXMLBNode.from_buffer(self._data, offset)
        node.offset = offset
        node.index = index
        node.tag = self._read_string(node.tag_string_offset)
        node.attributes = {
            a.key: a.value
            for i in range(
                node.first_attribute_index,
                node.first_attribute_index + node.attribute_count,
            )
            if (a := self._read_attribute(i)) is not None
        }
        return node

    def _read_attribute(self, index):
        if len(self._attributes) > index:
            return self._attributes[index]
        offset = self._header.attributes_table_offset + index * sizeof(CryXMLBAttribute)
        attrib = CryXMLBAttribute.from_buffer(self._data, offset)
        attrib.key = self._read_string(attrib.key_string_offset)
        attrib.value = self._read_string(attrib.value_string_offset)
        return attrib

    def _read_child_index(self, index):
        if len(self._child_indices) > index:
            return self._child_indices[index]
        offset = self._header.child_table_offset + index * sizeof(CryXMLBNodeIndex)
        return CryXMLBNodeIndex.from_buffer(self._data, offset)

    def _iter_parse_nodes(self, node: CryXMLBNode):
        self.StartElementHandler(node.tag, node.attributes)
        content = self._read_string(node.content_string_offset)
        if content:
            self.CharacterDataHandler(content)

        for i in range(node.first_child_index, node.first_child_index + node.child_count):
            self._iter_parse_nodes(self._read_node(self._read_child_index(i).index))

        self.EndElementHandler(node.tag)

    def Parse(self, data):
        if len(data) < sizeof(CryXMLBHeader):
            raise ValueError("File is not a binary XML file (file size is too small).")

        self._data = data
        self._header = CryXMLBHeader.from_buffer(data, 0)

        # TODO: actually do header validation - see references
        if self._header.signature != CRYXMLB_SIGNATURE:
            if self._header.signature.startswith(b"<"):
                # try parsing as a normal xml file
                parser = XMLParser(target=self.target)
                parser.feed(self._data)
                raise _StandardXmlFile()
            raise ParseError("Invalid CryXmlB Signature")

        self._attributes = [self._read_attribute(i) for i in range(self._header.attributes_count)]
        self._child_indices = [
            self._read_child_index(i) for i in range(self._header.child_table_count)
        ]
        self._nodes = [self._read_node(i) for i in range(self._header.node_count)]

        root_node = self._read_node(0)
        assert root_node.parent_index == CRYXML_NO_PARENT
        self._iter_parse_nodes(root_node)


class CryXMLBParser:
    """
    Parser for CIG's Lumberyard/CryEngine binary XML format.

    Example usage:

    .. code-block:: python

        from xml.etree import ElementTree
        et = ElementTree.parse('path/to/sc_cryxml.xml', parser=CryXMLBParser())
    """

    def __init__(self, *, target=None, encoding="UTF-8"):
        if target is None:
            target = TreeBuilder()

        self._data = bytearray()
        self.parser = self._parser = _CryXMLBParser(target, encoding)
        self.target = self._target = target
        self.target = target
        self.encoding = encoding
        self._error = ValueError
        self._names = {}  # name memo cache
        # main callbacks
        if hasattr(target, "start"):
            self.parser.StartElementHandler = self._start
        if hasattr(target, "end"):
            self.parser.EndElementHandler = self._end
        if hasattr(target, "start_ns"):
            self.parser.StartNamespaceDeclHandler = self._start_ns
        if hasattr(target, "end_ns"):
            self.parser.EndNamespaceDeclHandler = self._end_ns
        if hasattr(target, "data"):
            self.parser.CharacterDataHandler = target.data
        # miscellaneous callbacks
        if hasattr(target, "comment"):
            self.parser.CommentHandler = target.comment
        if hasattr(target, "pi"):
            self.parser.ProcessingInstructionHandler = target.pi
        self.entity = {}

    def _raiseerror(self, value):
        err = ParseError(value)
        raise err

    def _fixname(self, key):
        # expand qname, and convert name string to ascii, if possible
        try:
            name = self._names[key]
        except KeyError:
            name = key
            if "}" in name:
                name = "{" + name
            self._names[key] = name
        return name

    def _start_ns(self, prefix, uri):
        return self.target.start_ns(prefix or "", uri or "")

    def _end_ns(self, prefix):
        return self.target.end_ns(prefix or "")

    def _start(self, tag, attrib):
        fixname = self._fixname
        tag = fixname(tag)
        return self.target.start(tag, attrib)

    def _end(self, tag):
        return self.target.end(self._fixname(tag))

    def feed(self, data):
        """Feed encoded data to parser."""
        self._data.extend(data)

    def close(self):
        """Finish feeding data to parser and return element structure."""
        try:
            self.parser.Parse(self._data)
        except _StandardXmlFile:
            pass
        except self._error as v:
            self._raiseerror(v)
        try:
            close_handler = self.target.close
        except AttributeError:
            pass
        else:
            return close_handler()
        finally:
            # get rid of circular references
            del self.parser, self._parser
            del self.target, self._target


def is_cryxmlb_file(source):
    if isinstance(source, (bytes, bytearray)):
        return source.startswith(CRYXMLB_SIGNATURE)

    loc = source.tell()
    try:
        # seeking to the very end causes problems with zip file entries
        source.seek(sizeof(CryXMLBHeader), 0)
        if source.tell() < sizeof(CryXMLBHeader):
            return False

        source.seek(0)
        return source.read(len(CRYXMLB_SIGNATURE)) == CRYXMLB_SIGNATURE
    finally:
        source.seek(loc)


def etree_from_cryxml_file(source) -> ElementTree:
    """Convenience method that converts the file `source` to an ElementTree.

    :param source: File name or file object
    """
    return ElementTree.parse(source, parser=CryXMLBParser())


def etree_from_cryxml_string(string) -> ElementTree:
    """Convenience method that converts the data `string` to an ElementTree.

    :param string: CryXMLB data
    """
    return ElementTree.fromstring(string, parser=CryXMLBParser())


def dict_from_cryxml_file(source) -> dict:
    """Convenience method that converts the file `source` to a dictionary.

    :param source: File name or file object
    """
    return etree_to_dict(etree_from_cryxml_file(source))


def dict_from_cryxml_string(string) -> dict:
    """Convenience method that converts the data `string` to a dictionary.

    :param string: CryXMLB data
    """
    return etree_to_dict(etree_from_cryxml_string(string))


_CAMELCASE_TO_SNAKE_RE = re.compile(r"((?<=[a-z0-9])[A-Z]|(?!^)(?<!_)[A-Z](?=[a-z]))")


def camel_attr_to_snake(name) -> str:
    """
    Converts a `CamelCase` attr name to snake_case.

    `@ColorRGB` -> `color_rgb`

    :param name: CamelCased attribute name
    :return: Snake cased variant
    """
    if name[0] == "@":
        name = name[1:]
    return _CAMELCASE_TO_SNAKE_RE.sub(r"_\1", name).lower()


@plugins.register
class CryXmlConverter(plugins.P4KConverterPlugin):
    name = "cryxml_converter"
    display_name = "CryXml Converter"
    handles = CRYXMLB_EXTENSIONS

    @classmethod
    def convert(
        cls,
        members: typing.List["P4KInfo"],
        path: Path,
        overwrite: bool = False,
        save_to: bool = False,
        options: typing.Dict = None,
        monitor: typing.Callable = None,
    ) -> typing.Tuple[typing.List["P4KInfo"], typing.List[Path]]:

        options = options or {}
        unhandled_members = []
        extracted_paths = []
        convert_cryxml_fmt = options.get("cryxml_converter_fmt", "xml").casefold()
        mtl_fix_name = options.get("cryxml_converter_mtl_fix_names", False)

        if convert_cryxml_fmt == "cryxmlb":
            return members, extracted_paths

        while members:
            member = members.pop()
            ext = member.filename.split(".", maxsplit=1)[-1].casefold()

            if ext not in CRYXMLB_EXTENSIONS:
                unhandled_members.append(member)
            else:
                outpath = cls.outpath(path, member, save_to)

                if overwrite or not outpath.is_file():
                    try:
                        with member.open("rb") as member_file:
                            if is_cryxmlb_file(member_file):
                                outpath.parent.mkdir(exist_ok=True, parents=True)
                                et = etree_from_cryxml_file(member_file)

                                if ext == "mtl" and mtl_fix_name:
                                    # Blender DAE importer does not support spaces in material names. Material names
                                    # are derived from the associated `mtl` of a model, therefore we've added this "fix"
                                    # to normalize names of materials so the generated collada files have acceptable
                                    # names
                                    for e in et.findall(".//Material"):
                                        if "Name" not in e.attrib:
                                            continue
                                        e.attrib["Name"] = normalize_material_name(e.attrib["Name"])

                                with outpath.open("w") as outfile:
                                    if convert_cryxml_fmt == "xml":
                                        outfile.write(pprint_xml_tree(et))
                                    else:
                                        json.dump(etree_to_dict(et), outfile, indent=2)
                                if monitor is not None:
                                    monitor(monitor_msg_from_info(member))
                            else:
                                unhandled_members.append(member)
                        extracted_paths.append(outpath.as_posix())
                    except Exception as e:
                        logger.exception(
                            f"Failed to convert CryXmlB file {member.filename}",
                            exc_info=e,
                        )
                        unhandled_members.append(member)

        return unhandled_members, extracted_paths


if __name__ == "__main__":
    x = etree_from_cryxml_file("scdatatools/research/cryxml/ProcClipConversion.cryxml")
    print(pprint_xml_tree(x))
