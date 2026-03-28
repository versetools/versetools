import json
from io import BytesIO

from scdatatools.engine.cryxml import dict_from_cryxml_file, etree_from_cryxml_file
from . import defs
from .base import Chunk


@defs.chunk_handler(defs.ChunkType.CryXMLB, versions=[0x003])
class CryXMLBChunk(Chunk):
    def dict(self):
        return dict_from_cryxml_file(BytesIO(self.chunk_data.data))

    def etree(self):
        return etree_from_cryxml_file(BytesIO(self.chunk_data.data))


@defs.chunk_handler(defs.ChunkType.JSON, versions=[0x744, 0x15])
class JSONChunk(Chunk):
    def dict(self):
        return json.loads(self.chunk_data.data.decode("utf-8"))
