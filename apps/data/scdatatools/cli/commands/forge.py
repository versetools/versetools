import logging
import sys
import typing
from collections import OrderedDict
from itertools import chain
from pathlib import Path

from nubia import command, argument
from nubia.internal.typing import _ArgDecoratorSpec, _init_attr
from rich import get_console, table

from scdatatools.forge import DataCoreBinary
from . import common
from ..utils import track

if typing.TYPE_CHECKING:
    pass


logger = logging.getLogger(__name__)


def _dump_record(dcb, record, output, guid, guid_if_exists, xml):
    if output == "-":
        if xml:
            sys.stdout.write(dcb.dump_record_xml(record) + "\n")
        else:
            sys.stdout.write(dcb.dump_record_json(record) + "\n")
    else:
        if output.is_dir():
            output = output / Path(record.filename)
        output.parent.mkdir(parents=True, exist_ok=True)
        suffix = ".xml" if xml else ".json"
        if guid or (guid_if_exists and output.is_file()):
            output = output.parent / f"{output.stem}.{record.id.value}{suffix}"
        else:
            output = output.parent / f"{output.stem}{suffix}"
        logger.info(str(output))
        try:
            with open(output, "w") as target:
                if xml:
                    target.write(dcb.dump_record_xml(record))
                else:
                    target.write(dcb.dump_record_json(record))
        except ValueError as e:
            print(f"ERROR: Error processing {record.filename}: {e}")


def forge_common_args(function):
    _init_attr(function, "__annotations__", OrderedDict())
    _init_attr(function, "__arguments_decorator_specs", {})
    function.__annotations__.setdefault("forge_file", str)
    function.__arguments_decorator_specs["forge_file"] = _ArgDecoratorSpec(
        arg="forge_file",
        name="forge_file",
        aliases=[],
        positional=True,
        choices=[],
        description="DataForge (.dcb) file to extract data from. (or Data.p4k or Star Citizen installation directory)",
    )
    function.__annotations__.setdefault("filter", typing.List[str])
    function.__arguments_decorator_specs["filter"] = _ArgDecoratorSpec(
        arg="filter",
        name="filter",
        choices=[],
        aliases=["-f"],
        positional=False,
        description="Posix style file filter of which files to extract",
    )
    return function


def parse_forge_args(forge_file, filter):
    forge_file = Path(forge_file).expanduser()
    filters = [_.strip("'").strip('"') for _ in filter]

    if forge_file.suffix.casefold() == ".p4k" or forge_file.is_dir():
        logger.info(f"Opening DataCore from {forge_file}")
        dcb = common.open_sc_dir(forge_file).datacore
    else:
        logger.info(f"Opening DataForge file: {forge_file}")
        dcb = DataCoreBinary(str(forge_file))

    # using the dict like this ends up removing duplicated but keeping the order of insertion
    records = dict(chain((str(r.id), r) for f in filters for r in dcb.search_filename(f)))
    return dcb, filters, records


@command
class forge:
    """Tools for interacting with the Dataforge database"""

    @command
    @forge_common_args
    def ls(self, forge_file: str, filter: typing.List[str] = ("*",)):
        """List records in the Data Core"""
        dcb, filters, records = parse_forge_args(forge_file, filter)
        logger.info(f"{filters = }")

        # TODO: add more ls type formatting flags

        t = table.Table(box=None)
        t.add_column("GUID")
        t.add_column("filename")
        for r in records.values():
            t.add_row(str(r.id), r.filename)
        get_console().print(t)

    @command(exclusive_arguments=("xml", "json"), aliases=["x"])
    @forge_common_args
    @argument("single", description="Extract first matching file only", aliases=["-1"])
    @argument(
        "guid",
        aliases=["-g"],
        description="Include the GUID in the filename (avoids overwriting from records with the same 'filename') "
        "(Default: False)",
    )
    @argument(
        "guid_if_exists",
        aliases=["-G"],
        description="Include the GUID in the filename only if the output file already exists. (Default: True)",
    )
    @argument("xml", aliases=["-x"], description="Convert to XML (Default)")
    @argument("json", aliases=["-j"], description="Convert to JSON")
    @argument(
        "output",
        description="The output directory to extract files into or the output path if --single. "
        "Defaults to current directory. Use '-' to output a single file to the stdout",
        aliases=["-o"],
    )
    def extract(
        self,
        forge_file: typing.Text,
        filter: typing.List[str] = ("*",),
        output: typing.Text = ".",
        guid: bool = False,
        guid_if_exists: bool = True,
        xml: bool = True,
        json: bool = False,
        single: bool = False,
    ):
        """Extracts DataCore records and converts them to a given format (xml/json). Use the `--filter` argument
        to down-select which records to extract, by default it will extract all of them to the `--output` directory."""
        dcb, filters, records = parse_forge_args(forge_file, filter)
        output = Path(output).absolute() if output != "-" else output

        if single:
            print(f"Extracting first match for filters '{','.join(filters)}' to {output}")
            print("=" * 120)
            if not records:
                sys.stderr.write(f"No files found for filter")
                sys.exit(2)
            _dump_record(dcb, next(iter(records.values())), output, guid, guid_if_exists, not json)
        else:
            print(f"Extracting files into {output} with filter '{filters}'")
            print("=" * 120)
            try:
                if output == "-":
                    # don't output the progress bar if we're dumping to the console
                    for record in records.values():
                        _dump_record(dcb, record, output, guid, guid_if_exists, not json)
                else:
                    output = Path(output)
                    output.mkdir(parents=True, exist_ok=True)
                    for record in track(
                        records.values(), description="Extracting records", unit="records"
                    ):
                        _dump_record(dcb, record, output, guid, guid_if_exists, not json)
            except KeyboardInterrupt:
                pass
