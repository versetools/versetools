import ctypes
import struct

from scdatatools.wwise.defs.bnk.hirc import HIRC_SIGNATURE, HIRCHeader

BNK_SIGNATURE = b"BKHD"
DIDX_SIGNATURE = b"DIDX"
DATA_SIGNATURE = b"DATA"
STID_SIGNATURE = b"STID"
INIT_SIGNATURE = b"INIT"
STMG_SIGNATURE = b"STMG"
ENVS_SIGNATURE = b"ENVS"
PLAT_SIGNATURE = b"PLAT"


class GUID(ctypes.LittleEndianStructure):
    _fields_ = [("raw_guid", ctypes.c_byte * 16)]

    @property
    def value(self):
        c, b, a, k, j, i, h, g, f, e, d = struct.unpack("<HHI8B", self.raw_guid)
        return f"{a:08x}-{b:04x}-{c:04x}-{d:02x}{e:02x}-{f:02x}{g:02x}{h:02x}{i:02x}{j:02x}{k:02x}"

    def __repr__(self):
        return f"<GUID: {self.value}>"

    def __str__(self):
        return self.value


class BNKHeader(ctypes.LittleEndianStructure):
    _fields_ = [
        ("signature", ctypes.c_char * 4),
        ("length", ctypes.c_uint32),
        ("version", ctypes.c_uint32),
        ("id", GUID),
        ("reserved1", ctypes.c_uint32),
        ("reserved2", ctypes.c_uint32),
    ]


class DIDXWemRecord(ctypes.LittleEndianStructure):
    _fields_ = [
        ("id", ctypes.c_uint32),
        ("data_offset", ctypes.c_uint32),
        ("length", ctypes.c_uint32),
    ]


class DIDXHeader(ctypes.LittleEndianStructure):
    _fields_ = [("signature", ctypes.c_char * 4), ("length", ctypes.c_uint32)]

    @classmethod
    def from_buffer(cls, source, offset=0):
        didx = type(cls).from_buffer(cls, source, offset)
        assert didx.signature == DIDX_SIGNATURE

        didx.wem_hdrs = []
        num_wems = didx.length // ctypes.sizeof(DIDXWemRecord)
        for i in range(num_wems):
            didx.wem_hdrs.append(
                DIDXWemRecord.from_buffer(source, offset + 8 + (i * ctypes.sizeof(DIDXWemRecord)))
            )
        return didx

    def calculated_size(self):
        return ctypes.sizeof(DIDXHeader) + ctypes.sizeof(DIDXWemRecord) * len(
            getattr(self, "wem_hdrs", [])
        )


class DATAHeader(ctypes.LittleEndianStructure):
    _fields_ = [("signature", ctypes.c_char * 4), ("length", ctypes.c_uint32)]


class INITHeader(ctypes.LittleEndianStructure):
    _fields_ = [
        ("signature", ctypes.c_char * 4),
        ("length", ctypes.c_uint32),
    ]
    # TODO: this chunk is unknown


class STMGHeader(ctypes.LittleEndianStructure):
    _fields_ = [
        ("signature", ctypes.c_char * 4),
        ("length", ctypes.c_uint32),
    ]
    # TODO: http://wiki.xentax.com/index.php/Wwise_SoundBank_(*.bnk)#STMG_section


class ENVSHeader(ctypes.LittleEndianStructure):
    _fields_ = [
        ("signature", ctypes.c_char * 4),
        ("length", ctypes.c_uint32),
    ]
    # TODO: http://wiki.xentax.com/index.php/Wwise_SoundBank_(*.bnk)#ENVS_section


class PLATHeader(ctypes.LittleEndianStructure):
    _fields_ = [
        ("signature", ctypes.c_char * 4),
        ("length", ctypes.c_uint32),
    ]
    # TODO: this chunk is unknown


class STIDSoundBankHeader(ctypes.LittleEndianStructure):
    _fields_ = [("id", ctypes.c_uint32), ("name_length", ctypes.c_uint8)]

    @classmethod
    def from_buffer(cls, source, offset=0):
        hdr = type(cls).from_buffer(cls, source, offset)
        hdr.length = ctypes.sizeof(cls) + hdr.name_length
        hdr.name = source[
            offset + ctypes.sizeof(cls) : offset + ctypes.sizeof(cls) + hdr.name_length
        ].decode("utf-8")
        return hdr


class STIDHeader(ctypes.LittleEndianStructure):
    _fields_ = [
        ("signature", ctypes.c_char * 4),
        ("length", ctypes.c_uint32),
        ("unknown", ctypes.c_uint32),
        ("num_soundbanks", ctypes.c_uint32),
    ]

    @classmethod
    def from_buffer(cls, source, offset=0):
        stid = type(cls).from_buffer(cls, source, offset)
        assert stid.signature == STID_SIGNATURE

        stid.sound_banks = []
        banks_offset = offset + ctypes.sizeof(cls)
        for i in range(stid.num_soundbanks):
            hdr = STIDSoundBankHeader.from_buffer(source, banks_offset)
            stid.sound_banks.append(hdr)
            offset += hdr.length
        return stid


HEADER_FOR_SIGNATURE = {
    BNK_SIGNATURE: BNKHeader,
    DIDX_SIGNATURE: DIDXHeader,
    DATA_SIGNATURE: DATAHeader,
    HIRC_SIGNATURE: HIRCHeader,
    INIT_SIGNATURE: INITHeader,
    STID_SIGNATURE: STIDHeader,
    STMG_SIGNATURE: STMGHeader,
    ENVS_SIGNATURE: ENVSHeader,
    PLAT_SIGNATURE: PLATHeader,
}
