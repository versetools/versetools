import ctypes
from enum import IntEnum

from scdatatools.utils import FileHeaderStructure

from .chunks import defs
from .chunks.base import ChunkHeader, Chunk


CHCR_FILE_SIGNATURE = b"CrCh"


class ChCrVersion(IntEnum):
    CRYTEK_3_6 = 0x746
    # CRYTEK_3_5 = 0x745
    # CRYTEK_3_4 = 0x744


@defs.chunk_file_header(CHCR_FILE_SIGNATURE)
class ChCrHeader(ctypes.LittleEndianStructure, FileHeaderStructure):
    file_type = "CrCh"
    _fields_ = [
        ("signature", ctypes.c_uint32),
        ("version", ctypes.c_uint32),
        ("num_chunks", ctypes.c_uint32),
        ("chunk_hdr_table_offset", ctypes.c_uint32),
    ]
    _map = {"version": ChCrVersion}


@defs.chunk_header_handler(0x746)
class ChunkHeader746(ChunkHeader):
    default_chunk_class = Chunk
    _fields_ = [
        ("type", ctypes.c_uint16),
        ("version", ctypes.c_uint16),
        ("id", ctypes.c_uint32),
        ("size", ctypes.c_uint32),
        ("offset", ctypes.c_uint32),
    ]
    _map = {"type": defs.ChunkType}


# class ChCr(Model):
#     filetype = 'ChCr'
#
#     def __init__(self, file_or_data, filename='', p4kinfo=None, *args, **kwargs):
#         super().__init__(file_or_data, filename=filename, p4kinfo=p4kinfo, *args, **kwargs)
#
#         self.model_header = ChCrHeader.from_buffer(self.model_data, 0)
#         if self.model_header.signature != CHCR_FILE_SIGNATURE:
#             raise ValueError(f'Invalid file signature for ChCr: {self.model_header.signature}')
#
#         self.mesh_header = None
#         if self.mesh_data is not None:
#             self.mesh_header = ChCrHeader.from_buffer(self.mesh_data, 0)
#             if self.mesh_header.signature != CHCR_FILE_SIGNATURE:
#                 raise ValueError(f'Invalid file signature for ChCr mesh: {self.mesh_header.signature}')
#
#         self._load_chunks(self.model_header, self.model_data)
#         self._load_chunks(self.mesh_header, self.mesh_data)
#
#         # build up node tree
#         self.root_nodes = []
#         for chunk in self.chunks.values():
#             if not isinstance(chunk, chunks.nodes.Node):
#                 continue
#             if chunk.parent_id in self.chunks:
#                 self.chunks[chunk.parent_id].children.append(chunk)
#             else:
#                 self.root_nodes.append(chunk)
#
#     def _load_chunks(self, header, data):
#         if data is None:
#             return
#
#         offset = header.chunk_table_offset
#         chunk_headers = [
#             chunks.base.ChunkHeader.from_buffer(data, offset + (i * ctypes.sizeof(chunks.base.ChunkHeader)))
#             for i in range(header.num_chunks)
#         ]
#
#         for h in chunk_headers:
#             try:
#                 self.chunks[h.id] = chunks.from_header(h, data, self)
#             except Exception as e:
#                 sys.stderr.write(f'\nError processing chunk {repr(h)}: {repr(e)}\n')
#                 self.chunks[h.id] = chunks.Chunk(h, data, self)
