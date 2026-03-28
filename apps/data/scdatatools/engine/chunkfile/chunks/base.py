import ctypes
import struct

import numpy as np

from scdatatools.utils import StructureWithEnums


class ChunkData:
    def __init__(self, header, data):
        self.header = header
        self.data = data
        self._offset = 0

    def read(self, length=None):
        try:
            if length is None:
                length = len(self.data) - self._offset
            return self.data[self._offset: self._offset + length]
        finally:
            self._offset = min(self._offset + length, len(self.data))

    def peek(self, length=None):
        if length is None:
            length = len(self.data) - self._offset
        return self.data[self._offset: self._offset + length]

    def tell(self):
        return self._offset

    def seek(self, offset, whence=1):
        if whence == 0:
            new_offset = offset
        elif whence == 1:
            new_offset = self._offset + offset
        elif whence == 2:
            new_offset = len(self.data) + offset
        else:
            raise ValueError(f'Invalid whence value "{whence}"')

        if new_offset > len(self.data):
            raise IndexError(f"index out of range")
        self._offset = new_offset

    def unpack(self, fmt):
        res = struct.unpack(fmt, self.read(struct.calcsize(fmt)))
        if len(fmt) == 1:
            return res[0]
        return res

    def np_frombuffer(self, length, dtype, *args, **kwargs):
        a = np.frombuffer(
            self.data[self._offset: self._offset + length],
            dtype=dtype,
            *args,
            **kwargs,
        )
        self._offset += length
        return a

    def np_ndarray(self, length, dtype, *args, **kwargs):
        a = np.ndarray(
            buffer=self.data[self._offset: self._offset + length],
            dtype=dtype,
            *args,
            **kwargs,
        )
        self._offset += length
        return a

    def __repr__(self):
        return f"<Chunk type:{repr(self.header.type)} id:{self.id} size:{self.header.size} offset:{self.header.offset}>"

    @property
    def id(self):
        return self.header.id

    @classmethod
    def from_buffer(cls, header, data):
        return cls(header, data[header.offset: header.offset + header.size])


class Chunk:
    def __init__(self, header, data, chunk_file):
        self.chunk_data = ChunkData(header, data)
        self.chunk_file = chunk_file

    @property
    def id(self):
        return self.chunk_data.header.id

    @property
    def chunk_type(self):
        return self.chunk_data.header.type

    @property
    def chunk_header(self):
        return self.chunk_data.header

    @classmethod
    def from_buffer(cls, header, data, chunk_file):
        return cls(header, data[header.offset: header.offset + header.size], chunk_file)

    def __repr__(self):
        return f"<{self.__class__.__name__} id:{self.id} type:{self.chunk_type}>"


class Chunk900(Chunk):
    size = 0  # used by from_buffer to isolate the data from the buffer

    def __repr__(self):
        return (
            f"<Chunk900 type:{repr(self.chunk_data.header.type)} size:{self.size} "
            f"offset:{self.chunk_data.header.offset}>"
        )

    @property
    def id(self):
        if hasattr(self.chunk_header.type, "name"):
            return self.chunk_header.type.name
        return f"{self.chunk_header.type:02x}"

    @classmethod
    def from_buffer(cls, header, data, chunk_file):
        if cls.size > 0:
            return cls(header, data[header.offset: header.offset + cls.size], chunk_file)
        return cls(header, data[header.offset:], chunk_file)


class ChunkHeader(ctypes.LittleEndianStructure, StructureWithEnums):
    default_chunk_class = Chunk
    _fields_ = []
    _map = {}
