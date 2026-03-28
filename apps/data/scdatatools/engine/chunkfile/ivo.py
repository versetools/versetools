import ctypes
from enum import IntEnum

from scdatatools.utils import FileHeaderStructure

from .chunks import defs
from .chunks.base import ChunkHeader, Chunk900


IVO_FILE_SIGNATURE = b"#ivo"


class IvoVersion(IntEnum):
    SC_3_11 = 0x900


@defs.chunk_file_header(IVO_FILE_SIGNATURE)
class IvoHeader(ctypes.LittleEndianStructure, FileHeaderStructure):
    file_type = "#ivo"
    _fields_ = [  # #ivo files must be 8-byte aligned
        ("signature", ctypes.c_uint32),  # FILE_SIGNATURE
        ("version", ctypes.c_uint32),  # IvoVersion
        ("num_chunks", ctypes.c_uint32),  # must be  0 < num_chunks < 7
        ("chunk_hdr_table_offset", ctypes.c_uint32),
    ]
    _map = {"version": IvoVersion}


@defs.chunk_header_handler(0x900)
class IvoChunkHeader(ChunkHeader):
    default_chunk_class = Chunk900
    _fields_ = [
        ("id", ctypes.c_uint16),
        ("type", ctypes.c_uint16),
        ("ivo_version", ctypes.c_uint32),
        ("offset", ctypes.c_uint64),
    ]
    _map = {"type": defs.ChunkType}

    @property
    def id(self):
        return self.type.name if hasattr(self.type, "name") else f"{self.type:02x}"
