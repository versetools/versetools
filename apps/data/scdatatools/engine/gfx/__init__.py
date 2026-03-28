import ctypes
import struct
from enum import IntEnum
from pathlib import Path

GFX_FILE_SIGNATURE = b"GFX"


class GFXVersion(IntEnum):
    GFX11 = 0x11


class SWFRect(ctypes.LittleEndianStructure):
    _fields_ = []


class TagHeader(ctypes.LittleEndianStructure):
    _fields_ = [
        ("raw_header", ctypes.c_uint16),
    ]

    @classmethod
    def from_buffer(cls, source, offset):
        obj = type(cls).from_buffer(cls, source, offset)
        obj.offset = offset
        obj.type = obj.raw_header >> 6
        obj.length = obj.raw_header & 0x003F
        obj.data_offset = 2
        obj.data_length = obj.length
        if obj.length == 0x3F:
            obj.data_length = ctypes.c_uint32.from_buffer(source, offset + 2).value
            obj.length = obj.data_length
            obj.data_offset += 4
        obj.length += obj.data_offset
        return obj


class Tag:
    def __init__(self, header, data):
        self.header = header
        self.data = data

    def __repr__(self):
        return f"<Tag type:{repr(self.header.type)} length:{self.header.length}>"

    @classmethod
    def from_buffer(cls, header, data):
        return cls(header, data[header.data_offset : header.data_offset + header.data_length])


class ExportAssets(Tag):
    def __init__(self, header, data):
        super().__init__(header, data)
        offset = 2
        self.assets = []
        while offset < self.header.data_length:
            str_end = data[offset + 2 :].find(b"\x00")
            if str_end < 0:
                break
            self.assets.append(
                (
                    struct.unpack("<h", data[offset : offset + 2])[0],
                    data[offset + 2 : offset + 2 + str_end].decode("utf-8"),
                )
            )
            offset += 2 + str_end + 1

    def __repr__(self):
        return f"<ExportAssets type:{repr(self.header.type)} length:{self.header.length} assets:{len(self.assets)}>"


class GFXHeader(ctypes.LittleEndianStructure):
    _pack_ = 1
    _fields_ = [
        ("signature", 3 * ctypes.c_char),
        ("version", ctypes.c_uint8),
        ("file_length", ctypes.c_uint32),
        ("rect", 9 * ctypes.c_uint8),
        ("frame_rate", ctypes.c_uint16),
        ("frame_count", ctypes.c_uint16),
    ]
    _map = {"version": GFXVersion}


TAG_FOR_TYPE = {0x38: ExportAssets}


def tag_from_header(hdr: TagHeader, data: (bytearray, bytes), offset):
    """

    :param hdr: `ChunkHeader` describing the Chunk in `data`
    :param data: Data to read chunk from
    :return: `Chunk`
    """
    return TAG_FOR_TYPE.get(hdr.type, Tag).from_buffer(hdr, data)


class GFX:
    def __init__(self, gfx_file_or_data):
        if isinstance(gfx_file_or_data, str) and Path(gfx_file_or_data).is_file():
            self.filename = Path(gfx_file_or_data).absolute()
            with self.filename.open("rb") as f:
                self.raw_data = bytearray(f.read())
        else:
            self.filename = ""
            self.raw_data = bytearray(gfx_file_or_data)

        self.header = GFXHeader.from_buffer(self.raw_data, 0)
        if self.header.signature != GFX_FILE_SIGNATURE:
            raise ValueError(f"Invalid file signature for GFX: {self.header.signature}")

        self.tags = []
        self.assets = {}
        offset = ctypes.sizeof(self.header)
        while offset < self.header.file_length:
            tag_hdr = TagHeader.from_buffer(self.raw_data, offset)
            tag = tag_from_header(tag_hdr, self.raw_data[offset : offset + tag_hdr.length], offset)

            if isinstance(tag, ExportAssets):
                self.assets.update(tag.assets)

            self.tags.append(tag)
            offset += tag_hdr.length

    @property
    def version(self):
        return self.header.version
