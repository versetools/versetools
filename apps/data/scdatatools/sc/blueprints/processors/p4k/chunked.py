import json
import logging
import typing
from pathlib import Path

from scdatatools.engine.chunkfile import chunks
from scdatatools.engine.chunkfile import load_chunk_file
from scdatatools.sc.blueprints.common import RECORD_KEYS_WITH_PATHS
from scdatatools.sc.blueprints.processors import filetype_processor
from scdatatools.utils import dict_search

if typing.TYPE_CHECKING:
    from scdatatools.p4k import P4KInfo
    from scdatatools.sc.blueprints import Blueprint


@filetype_processor("cga", "cgam", "cgf", "cgfm", "chr", "soc", "dba", "skin", "skinm")
def process_chunked_file(bp: "Blueprint", path: str, p4k_info: "P4KInfo", *args, **kwargs) -> bool:
    try:
        c = load_chunk_file(p4k_info)
    except Exception as e:
        bp.log(f"Failed to load chunk file {path}: {e}", level=logging.ERROR)
        return False

    for chunk in c.chunks.values():
        if isinstance(chunk, chunks.CryXMLBChunk):
            x = chunk.dict()
            bp.add_file_to_extract(dict_search(x, RECORD_KEYS_WITH_PATHS, ignore_case=True))
            # Material keys don't have the extension
            for mat in dict_search(x, "@material", ignore_case=True):
                bp.add_material(mat)

            # store the extracted CryXmlB as json for later
            bp.converted_files[f"{p4k_info.filename}.cryxml.json"] = json.dumps(x, indent=2)
        elif isinstance(chunk, chunks.JSONChunk):
            x = chunk.dict()
            bp.add_file_to_extract(dict_search(x, RECORD_KEYS_WITH_PATHS, ignore_case=True))
            # store the extracted JSON for later
            bp.converted_files[f"{p4k_info.filename}.json"] = json.dumps(x, indent=2)
        elif isinstance(chunk, chunks.MtlName):
            mtl_path = Path(f"{chunk.name}").with_suffix(".mtl")
            geom, _ = bp.get_or_create_geom(path)
            geom.add_materials(bp.add_material(mtl_path, path))
        elif isinstance(chunk, chunks.IncludedObjects):
            bp.add_file_to_extract(chunk.filenames)
    return True
