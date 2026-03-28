import copy
import ctypes
import logging
import struct
from enum import IntEnum

from scdatatools.utils import StructureWithEnums

logger = logging.getLogger(__name__)
HIRC_SIGNATURE = b"HIRC"


class HIRCSettingsTypes(IntEnum):
    voice_volume = 0
    voice_lowpass_filter = 3


class AudioBusParameterType(IntEnum):
    voice_volume = 0
    voice_pitch = 2
    voice_lowpass_filter = 3
    bus_volums = 4


class HIRCObjectTypes(IntEnum):
    settings = 1
    sound = 2
    event_action = 3
    event = 4
    random = 5
    switch = 6
    actor_mixer = 7
    audio_bus = 8
    blend_container = 9
    music_segment = 10
    music_track = 11
    music_switch_container = 12
    music_playlist_container = 13
    attenuation = 14
    dialogue_event = 15
    motion_bus = 16
    motion_fx = 17
    effect = 18
    unknown1 = 19
    auxiliary_bus = 20
    unknown2 = 21
    unknown3 = 22


class HIRCObject(ctypes.LittleEndianStructure, StructureWithEnums):
    _pack_ = 1
    _fields_ = [
        ("type", ctypes.c_byte),
        ("length", ctypes.c_uint32),
        ("id", ctypes.c_uint32),
    ]
    _map = {"type": HIRCObjectTypes}

    @classmethod
    def from_buffer(cls, source, offset):
        obj = type(cls).from_buffer(cls, source, offset)
        obj.source_offset = offset
        obj.raw_data = copy.copy(source[offset : offset + obj.length + 1])
        return obj

    def __repr__(self):
        return f"<{self.__class__.__name__} type:{self.type.name} len:{self.length} id:{self.id}>"


class HIRCUnknown(HIRCObject):
    pass


class HIRCRandom(HIRCObject):
    # TODO: this obviously needs a lot of work
    _fields_ = [
        ("unknown1", ctypes.c_uint16),
        ("unknown2", ctypes.c_uint16),
        ("unknown3", ctypes.c_uint16),
        ("unknown4", ctypes.c_uint8),
        ("actor_mixer_id", ctypes.c_uint32),
        ("unknown5", ctypes.c_uint32),
        ("unknown6", ctypes.c_uint32),
        ("unknown7", ctypes.c_uint32),
        ("unknown8", ctypes.c_uint32),
        ("unknown9", ctypes.c_uint32),
        ("unknown10", ctypes.c_uint32),
        ("unknown11", ctypes.c_uint32),
        ("unknown12", ctypes.c_uint32),
        ("unknown13", ctypes.c_uint32),
        ("unknown14", ctypes.c_uint32),
        ("unknown15", ctypes.c_uint32),
        ("unknown16", ctypes.c_uint32),
        ("num_sounds", ctypes.c_uint32),
    ]

    @classmethod
    def from_buffer(cls, source, offset):
        r = type(cls).from_buffer(cls, source, offset)
        sound_offset = offset + ctypes.sizeof(r)
        if sound_offset + (r.num_sounds * 4) > sound_offset + r.length:
            # TODO: re-enable when diving back into HIRC stuff
            # logger.debug(f'Failed to read HIRCRandom object "{r.id}", setting sounds to []')
            r.sounds = []
        else:
            r.sounds = list(
                struct.unpack(
                    f"<{r.num_sounds}I",
                    source[sound_offset : sound_offset + (r.num_sounds * 4)],
                )
            )
        return r


class HIRCSettings(HIRCObject):
    # _pack_ = 1
    _fields_ = [
        ("num_settings", ctypes.c_byte),
    ]

    @classmethod
    def from_buffer(cls, source, offset=0):
        settings = type(cls).from_buffer(cls, source, offset)
        settings.settings = []

        offset += ctypes.sizeof(HIRCSettings)
        for i in range(settings.num_settings):
            settings.settings.append([HIRCSettingsTypes(source[offset + i])])

        offset += settings.num_settings
        for i in range(settings.num_settings):
            settings.settings[i].append(ctypes.c_float.from_buffer(source, offset + i))

        return settings


class HIRCSound(HIRCObject):
    _fields_ = [
        ("unknown", ctypes.c_uint32),
        ("method", ctypes.c_byte),
        ("wem_id", ctypes.c_uint32),
        ("source_id", ctypes.c_uint32),
        ("source_offset", ctypes.c_uint32),
    ]


class HIRCEventActionScope(IntEnum):
    GameObjectSwitchOrTrigger = 0x01
    Global = 0x02
    GameObjectRefObjectId = 0x03
    GameObjectState = 0x04
    All = 0x05
    AllExceptReferencedObjectId = 0x09


class HIRCEventActionType(IntEnum):
    # https://www.audiokinetic.com/library/edge/?source=Help&id=types_of_event_actions
    Stop = 1  # 0x01
    Pause = 2  # 0x02
    Resume = 3  # 0x03
    Play = 4  # 0x04
    Trigger = 5  # 0x05
    Mute = 6  # 0x06
    UnMute = 7  # 0x07
    SetVoicePitch = 8  # 0x08
    ResetVoicePitch = 9  # 0x09
    SetVoiceVolume = 10  # 0x0a
    ResetVoiceVolume = 11  # 0x0b
    SetBusVolume = 12  # 0x0c
    ResetBusVolume = 13  # 0x0d
    SetVoiceLowpassFilter = 14  # 0x0e
    ResetVoiceLowpassFilter = 15  # 0x0f
    EnableState = 16  # 0x10
    DisableState = 17  # 0x11
    SetState = 18  # 0x12
    SetGameParameter = 19  # 0x13
    ResetGameParameter = 20  # 0x14
    SetSwitch = 25  # 0x19
    EnableBypassOrDisableBypass = 26  # 0x1a
    ResetBypassEffect = 27  # 0x1b
    Break = 28  # 0x1c
    Unknown1 = 29  # 0x1d  Points to a sound
    Seek = 30  # 0x1e
    Unknown2 = 31  # 0x1f
    Unknown3 = 32  # 0x20
    PostEvent = 33  # 0x21  maybe? points to an event
    Unknown5 = 34  # 0x22
    Unknown6 = 35  # 0x23
    Unknown7 = 36  # 0x24
    Unknown8 = 37  # 0x25
    Unknown9 = 38  # 0x26
    Unknown10 = 39  # 0x27
    Unknown11 = 40  # 0x28
    Unknown12 = 41  # 0x29
    Unknown13 = 42  # 0x2a
    Unknown14 = 43  # 0x2b
    Unknown15 = 44  # 0x2c
    Unknown16 = 45  # 0x2d
    Unknown17 = 46  # 0x2e
    Unknown18 = 47  # 0x2f
    Unknown19 = 48  # 0x30
    # we've seen up to 0x30, so everything else is "future proofing"
    # Known "action_types" that are missing from above
    # Stop > Stop All
    # Pause > Pause All
    # Resume > Resume All
    # Seek > Seek All
    # Bus Volume > Reset Volume All
    # Voice Volume > Reset Volume All
    # Voice Pitch > Reset Voice Pitch All
    # Voice Low-pass Filter > Reset Voice Low-pass Filter All
    # Voice High-pass Filter > Set Voice High-pass Filter
    # Voice High-pass Filter > Reset Voice High-pass Filter
    # Voice High-pass Filter > Reset Voice High-pass Filter All
    # Mute > Unmute All
    # Bypass Effect > Reset Bypass Effect All
    # Release Envelope
    # Reset Playlist


class HIRCEventAction(HIRCObject):
    _fields_ = [
        ("scope", ctypes.c_byte),
        ("action_type", ctypes.c_byte),
        ("object_id", ctypes.c_uint32),
        ("reserved", ctypes.c_byte),
        ("num_params", ctypes.c_byte),
    ]
    # TODO: parse params
    _map = {
        "type": HIRCObjectTypes,
        "scope": HIRCEventActionScope,
        "action_type": HIRCEventActionType,
    }


class HIRCEvent(HIRCObject):
    _fields_ = [
        ("num_actions", ctypes.c_byte),
    ]

    @classmethod
    def from_buffer(cls, source, offset=0):
        he = type(cls).from_buffer(cls, source, offset)
        he.event_actions = []

        offset += ctypes.sizeof(he)
        for i in range(he.num_actions):
            he.event_actions.append(struct.unpack_from("<I", source, offset)[0])
            offset += 4
        return he


class HIRCAudioBus(HIRCObject):
    gtgtlds_ = [
        ("parent_id", ctypes.c_uint32),
        ("num_additional_params", ctypes.c_byte),
    ]

    @classmethod
    def from_buffer(cls, source, offset=0):
        ab = type(cls).from_buffer(cls, source, offset)

        # TODO: flesh out audio bus params
        #   http://wiki.xentax.com/index.php/Wwise_SoundBank_(*.bnk)#type_.238:_Audio_Bus

        return ab


class HIRCHeader(ctypes.LittleEndianStructure):
    _fields_ = [
        ("signature", ctypes.c_char * 4),
        ("length", ctypes.c_uint32),
        ("num_objects", ctypes.c_uint32),
    ]

    @classmethod
    def from_buffer(cls, source, offset=0):
        hirc = type(cls).from_buffer(cls, source, offset)
        assert hirc.signature == HIRC_SIGNATURE
        hirc.objects = []

        for t in HIRCObjectTypes:
            setattr(hirc, t.name, {})

        offset += ctypes.sizeof(hirc)
        for i in range(hirc.num_objects):
            obj_type = source[offset]
            obj = HIRC_OBJ_HEADER_FOR_TYPE.get(obj_type, HIRCUnknown).from_buffer(source, offset)
            obj.offset = offset
            hirc.objects.append(obj)
            getattr(hirc, obj.type.name)[obj.id] = obj
            # the `id` is included in the length? so we're only adding the type/len size (5)
            offset += obj.length + 5
        return hirc


HIRC_OBJ_HEADER_FOR_TYPE = {
    HIRCObjectTypes.settings: HIRCSettings,
    HIRCObjectTypes.sound: HIRCSound,
    HIRCObjectTypes.event_action: HIRCEventAction,
    HIRCObjectTypes.event: HIRCEvent,
    HIRCObjectTypes.random: HIRCRandom,
    HIRCObjectTypes.switch: HIRCObject,
    HIRCObjectTypes.audio_bus: HIRCAudioBus,
}
