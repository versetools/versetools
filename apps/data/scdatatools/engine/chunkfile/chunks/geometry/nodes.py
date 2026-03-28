import ctypes
import numpy as np
from ctypes import Structure
from functools import cached_property

from scdatatools.engine.chunkfile.chunks import defs
from scdatatools.engine.chunkfile.chunks.base import Chunk


@defs.chunk_handler(defs.ChunkType.Helper, versions=[0x744])
class Helper(Chunk):
    def __init__(self, header, data, model):
        super().__init__(header, data, model)

        if self.chunk_header.version == 0x744:
            self.helper_type = self.chunk_data.unpack("i")
            self.size = self.chunk_data.unpack("3f")
        else:
            raise NotImplementedError(
                f"Node version {self.chunk_header.version} has not been implemented yet"
            )


class Node824Struct(Structure):
    _fields_ = [
        ("name", ctypes.c_char * 64),
        ("object_id", ctypes.c_int32),
        ("parent_id", ctypes.c_int32),
        ("num_children", ctypes.c_int32),
        ("mat_id", ctypes.c_int32),
        ("_", ctypes.c_int32),
        ("transform", ctypes.c_float * 16),
        ("_", ctypes.c_byte * 40),
        ("controller_pos_id", ctypes.c_int32),
        ("controller_rot_id", ctypes.c_int32),
        ("controller_scale_id", ctypes.c_int32),
        ("properties_len", ctypes.c_int32),
    ]


@defs.chunk_handler(defs.ChunkType.Node, versions=[0x823, 0x824])
class Node(Chunk):
    def __init__(self, header, data, model):
        super().__init__(header, data, model)

        if self.chunk_header.version == 0x824:
            self.attrs = Node824Struct.from_buffer(self.chunk_data.data)
            self._props_offset = ctypes.sizeof(Node824Struct)
            self.parent_id = self.attrs.parent_id
        else:
            raise NotImplementedError(
                f"Node version {self.chunk_header.version} has not been implemented yet"
            )

        self.children = []

    @cached_property
    def name(self):
        return self.attrs.name.strip(b"\x00").decode("utf-8")

    @property
    def transform(self):
        return np.ndarray(buffer=self.attrs.transform, dtype=np.float32, shape=(4, 4))

    @property
    def controller_pos_id(self):
        return self.attrs.controller_pos_id

    @property
    def controller_rot_id(self):
        return self.attrs.controller_rot_id

    @property
    def num_children(self):
        return self.attrs.mat_id

    @property
    def mat_id(self):
        return self.attrs.mat_id

    @cached_property
    def properties(self):
        return (
            self.chunk_data.data[
                self._props_offset : self._props_offset + self.attrs.properties_len
            ]
            .strip(b"\x00")
            .decode("utf-8")
        )

    @property
    def object(self):
        return self.chunk_file.chunks.get(self.attrs.object_id)

    def __repr__(self):
        return (
            f'<Node Chunk id:{self.id} name:"{self.name}" obj_id:{self.attrs.object_id} '
            f"parent_id:{self.attrs.parent_id} children:{self.attrs.num_children}>"
        )
