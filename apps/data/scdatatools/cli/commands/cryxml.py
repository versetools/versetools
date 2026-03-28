import json
import sys
import typing
from pathlib import Path

from nubia import command, argument

from scdatatools.engine.cryxml import (
    etree_from_cryxml_file,
    dict_from_cryxml_file,
    is_cryxmlb_file,
)
from scdatatools.engine.cryxml.utils import pprint_xml_tree


def _do_conversions(cryxml_file, replace, output, fmt):
    if replace:
        output = Path(cryxml_file)

    with Path(cryxml_file).open("rb") as cxml:
        if is_cryxmlb_file(cxml):
            if fmt == "xml":
                d = pprint_xml_tree(etree_from_cryxml_file(cxml))
            else:
                d = json.dumps(dict_from_cryxml_file(cxml), indent=2)
        else:
            sys.stderr.write(f"{cryxml_file} is not a CryXmlB file\n")
            return False

    if output == "-":
        print(d)
    else:
        with open(output, "w") as f:
            f.write(d)
    return True


@command(help="Convert a CryXML file to xml")
@argument("cryxml_file", description="CryXML to convert", positional=True)
@argument("replace", aliases=["-r"], description="Convert the file in place")
@argument(
    "output",
    description="Output filename or '-' for stdout. Defaults to '-'. Ignored if --replace is set.",
    aliases=["-o"],
)
def cryxml_to_xml(cryxml_file: typing.Text, replace: bool = False, output: typing.Text = "-"):
    _do_conversions(cryxml_file, replace, output, "xml")


@command(help="Convert a CryXML file to JSON")
@argument("cryxml_file", description="CryXML to convert", positional=True)
@argument(
    "replace",
    aliases=["-r"],
    description="Convert the file in place. (will change the extension to .json)",
)
@argument(
    "output",
    description="Output filename or '-' for stdout. Defaults to '-'",
    aliases=["-o"],
)
def cryxml_to_json(cryxml_file: typing.Text, replace: bool = False, output: typing.Text = "-"):
    if _do_conversions(cryxml_file, replace, output, "json") and replace:
        Path(cryxml_file).unlink(missing_ok=True)
