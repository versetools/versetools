from .. import defs
from ..base import Chunk

from .materials import *
from .nodes import *


@defs.chunk_handler(defs.ChunkType.SourceInfo, versions=[0x000])
class SourceInfoChunk(Chunk):
    def __init__(self, header, data, model):
        super().__init__(header, data, model)
        self.raw_data = data
        self.data = "\n".join(self.raw_data.decode("utf-8").split("\x00"))


@defs.chunk_handler(defs.ChunkType.ExportFlags, versions=[0x001])
class ExportFlags001(Chunk):
    pass  # TODO: implement this


@defs.chunk_handler(defs.ChunkType.Controller, versions=[0x826])
class Controller826(Chunk):
    """
    e.g. 'Data/Objects/Spaceships/Ships/ORIG/400i/interior/Doors/ORIG_400i_InteriorLift.cga'
    chunk struct ChunkHeader746 {
        type [<enum 'ChunkType'>] = <ChunkType.Controller: 4109>;
        version [c_ushort] = 2086;
        id [c_ulong] = 4;
        size [c_ulong] = 96;
        offset [c_ulong] = 968;
    };
    """

    pass  # TODO: implement this


@defs.chunk_handler(defs.ChunkType.Timing, versions=[0x918])
class Timing918(Chunk):
    pass  # TODO: implement this
