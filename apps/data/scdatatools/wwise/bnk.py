import logging
import struct
from collections import defaultdict
from pathlib import Path

from .defs import bnk as bnk_defs
from .defs.bnk import hirc as hirc_defs
from .utils import wwise_id_for_string
from .wem import Wem

logger = logging.getLogger(__name__)


BRUTE_FORCE_TYPES = [
    hirc_defs.HIRCObjectTypes.random,
    hirc_defs.HIRCObjectTypes.blend_container,
    hirc_defs.HIRCObjectTypes.switch,
    hirc_defs.HIRCObjectTypes.music_switch_container,
    hirc_defs.HIRCObjectTypes.music_playlist_container,
    hirc_defs.HIRCObjectTypes.dialogue_event,
    hirc_defs.HIRCObjectTypes.music_segment,
    hirc_defs.HIRCObjectTypes.music_track,
]


class SoundBank:
    def __init__(self, file_or_buffer, filename=""):
        if isinstance(file_or_buffer, (str, Path)):
            self.filename = filename if filename else Path(file_or_buffer)
            self.raw_data = bytearray(Path(file_or_buffer).open("rb").read())
        else:
            self.filename = filename
            self.raw_data = bytearray(file_or_buffer)

        self.components = {}
        offset = 0
        try:
            while offset < len(self.raw_data):
                signature = self.raw_data[offset : offset + 4]
                hdr = bnk_defs.HEADER_FOR_SIGNATURE[bytes(signature)].from_buffer(
                    self.raw_data, offset
                )
                hdr.offset = offset
                setattr(
                    self,
                    signature.decode("utf-8", errors="ignore").strip().lower(),
                    hdr,
                )
                self.components[signature.decode("utf-8", errors="ignore").strip().lower()] = hdr
                offset += hdr.length + 8
        except ValueError:
            pass

        self.wems = {_.id: _ for _ in self.didx.wem_hdrs} if hasattr(self, "didx") else {}

    def extract_wem(self, id, filename):
        wem_hdr = self.wems[id]
        wem_offset = self.data.offset + 8 + wem_hdr.data_offset
        wem = Wem(data=self.raw_data[wem_offset : wem_offset + wem_hdr.length])
        wem.write_file(filename)


def _cmp_obj(a, a_bnk, b, b_bnk, msg):
    SKIP_ATTRS = ["source_offset", "raw_data", "offset", "settings"]
    a_cmp = {k: v for k, v in a.__dict__.items() if k not in SKIP_ATTRS}
    b_cmp = {k: v for k, v in b.__dict__.items() if k not in SKIP_ATTRS}
    if a_cmp != b_cmp:
        print(f"\n{msg}\n" + "=" * 40)
        print(f"{a_bnk}.hirc.{a.type.name}.{a.id}\n{repr(a_cmp)}")
        print(f"{b_bnk}.hirc.{b.type.name}.{b.id}\n{repr(b_cmp)}")


class BankManager:
    def __init__(self):
        self.banks = {}
        self.game_objects = defaultdict(dict)

    def __in__(self, name):
        return name in self.banks or name in self.game_objects

    def search_for_ids_in_buf(self, buf):
        found = []
        for i in range(len(buf) - 3):
            t = struct.unpack("<I", buf[i : i + 4])[0]
            for k in self.game_objects.keys():
                if t in self.game_objects[k]:
                    found.append(self.game_objects[k][t])
        return found

    def game_object_for_id(
        self, obj_id: int, obj_type: hirc_defs.HIRCObjectTypes = None
    ) -> hirc_defs.HIRCObject:
        """
        Find an object with `obj_id` in the loaded game object
        :param obj_id: `int` id to find
        :param obj_type: Either a `HIRCObjectTypes`, or a list of types to check for the `obj_id`. Default is to check
                         all types
        :return: The first matching game_object with `obj_id`
        """
        if obj_type is None or isinstance(obj_type, list):
            obj_type = [_ for _ in hirc_defs.HIRCObjectTypes] if obj_type is None else obj_type
            for t in obj_type:
                if obj_id in self.game_objects[t.name]:
                    return self.game_objects[t.name][obj_id]
            else:
                raise KeyError(f"ID does not exist for any of the types {obj_type}: {obj_id}")
        else:
            if obj_id not in self.game_objects[obj_type.name]:
                raise KeyError(f"ID does not exist for {obj_type.name}: {obj_id}")
            return self.game_objects[obj_type.name][obj_id]

    def _find_wems_from_hirc_object(self, obj_dict, _searched=None) -> list:
        obj = obj_dict["object"]
        _searched = [] if _searched is None else _searched
        if obj.id in _searched:
            return []

        if isinstance(obj, hirc_defs.HIRCEvent):
            event = self.game_objects["event"][obj.id]
            wems = set()
            for ea_id in event["object"].event_actions:
                wems.update(
                    self._find_wems_from_hirc_object(
                        self.game_objects["event_action"][ea_id],
                        _searched=_searched + [obj.id],
                    )
                )
                return list(wems)
        elif isinstance(obj, hirc_defs.HIRCEventAction):
            return self._find_wems_from_hirc_object(
                self.game_object_for_id(obj.object_id), _searched=_searched + [obj.id]
            )
        elif isinstance(obj, hirc_defs.HIRCSound):
            return [obj.wem_id]
        elif isinstance(obj, hirc_defs.HIRCRandom) and obj.sounds:
            wems = []
            for sid in obj.sounds:
                try:
                    wems.extend(
                        self._find_wems_from_hirc_object(
                            self.game_object_for_id(sid), _searched=_searched + [obj.id]
                        )
                    )
                except KeyError as e:
                    logger.error(
                        f"Error looking up sound id from HIRCRandom {obj.id} in "
                        f'{obj_dict["bank"].filename}: {e}'
                    )
            return wems
        elif obj.type in BRUTE_FORCE_TYPES:
            found_ids = [
                _
                for _ in self.search_for_ids_in_buf(
                    obj_dict["bank"].raw_data[obj.offset : obj.offset + obj.length]
                )
                if _["object"].id != obj.id
            ]

            wems = []
            for oid in found_ids:
                wems.extend(self._find_wems_from_hirc_object(oid, _searched=_searched + [obj.id]))
            return wems
        else:
            logger.warning(
                f'find_wems_from_hirc - Unhandled object type in {obj_dict["bank"].filename}: '
                f"{obj.type.name}.{obj.id} ({obj.type})"
            )
        return []

    def wems_for_event(self, event_id: int) -> list:
        if event_id not in self.game_objects["event"]:
            return []

        event = self.game_objects["event"][event_id]
        try:
            return self._find_wems_from_hirc_object(event)
        except KeyError as e:
            logger.error(f'{event["bank"].filename}.event.{event["object"].id}: {repr(e)}')
        return []

    def wems_for_atl_name(self, atl_name: str) -> list:
        return self.wems_for_event(wwise_id_for_string(atl_name))

    def load_bank(self, name, file_or_buffer):
        if name in self.banks:
            raise KeyError(f"Bank {name} has already been loaded")
        b = SoundBank(file_or_buffer, filename=name)
        if "hirc" in b.components:
            for o in b.hirc.objects:
                if o.id not in self.game_objects[o.type.name]:
                    self.game_objects[o.type.name][o.id] = {"object": o, "bank": b}
                else:
                    cmp = self.game_objects[o.type.name][o.id]
                    _cmp_obj(
                        o,
                        name,
                        cmp["object"],
                        cmp["bank"].filename,
                        "possible game object duplicate",
                    )
        self.banks[name] = b
