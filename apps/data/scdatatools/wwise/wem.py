import ctypes
import struct
from pathlib import Path

from .defs import wem as wem_defs


class Wem:
    def __init__(
        self,
        data,
        format=wem_defs.WEM_FMT,
        channels=2,
        sample_rate=48000,
        avg_byterate=32000,
    ):
        self.sample_rate = sample_rate
        self.channels = channels
        self.format = format
        self.avg_byterate = avg_byterate
        self.data = data
        # 28        4   ByteRate         == SampleRate * NumChannels * BitsPerSample/8
        # 32        2   BlockAlign       == NumChannels * BitsPerSample/8

    def write_file(self, filename):
        data = b"data" + struct.pack("<I", len(self.data)) + self.data

        fmt_hdr = wem_defs.WemFormatHeader(
            size=ctypes.sizeof(wem_defs.WemFormatHeader) + len(wem_defs.VORB_HDR) - 8,
            format=0xFFFF,
            channels=self.channels,
            sample_rate=self.sample_rate,
            avg_bytes_per_sec=self.avg_byterate,
        )
        fmt_hdr = bytes(fmt_hdr) + wem_defs.VORB_HDR

        riff_hdr = wem_defs.WemRiffHeader(
            id=wem_defs.RIFF_SIGNATURE,
            size=len(fmt_hdr) + len(data) + 4,
            format=wem_defs.RIFF_FORMAT,
        )

        with Path(filename).open("wb") as out:
            out.write(bytes(riff_hdr))
            out.write(fmt_hdr)
            out.write(data)
