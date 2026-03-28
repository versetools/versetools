import ctypes

RIFF_SIGNATURE = b"RIFF"
RIFF_FORMAT = b"WAVE"
WEM_FMT = 0xFFFF
VORB_HDR = (
    b"\x30\x00\x00\x00\x02\x31\x00\x00\x00\xB6\x29\x02\xE6\x00\x00\x00\x41\x78\x4D\x01\x00\x00\x40\x03\xA8\x15"
    b"\x02\x00\x8E\x16\x02\x00\xCD\x02\x40\x03\x20\x4C\x00\x00\x10\x4E\x00\x00\xE6\xE0\xC5\x3F\x08\x0B"
)


class WemRiffHeader(ctypes.LittleEndianStructure):
    _fields_ = [
        ("id", ctypes.c_char * 4),
        ("size", ctypes.c_uint32),
        ("format", ctypes.c_char * 4),
    ]


class WemFormatHeader(ctypes.LittleEndianStructure):
    _fields_ = [
        ("id", ctypes.c_char * 4),
        ("size", ctypes.c_uint32),
        ("format", ctypes.c_uint16),
        ("channels", ctypes.c_uint16),
        ("sample_rate", ctypes.c_uint32),
        ("avg_bytes_per_sec", ctypes.c_uint32),
        ("block_align", ctypes.c_uint16),
        ("bits_per_sample", ctypes.c_uint16),
    ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.id = b"fmt "
        self.extra_data = b""
