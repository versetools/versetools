import ctypes
import io
import json
import sys
import typing
import zlib
from collections import defaultdict
from contextlib import contextmanager
from datetime import datetime
from distutils.util import strtobool
from pathlib import Path
from xml.etree import ElementTree

import numpy
import xxhash
from pyquaternion import Quaternion

from scdatatools.engine.model_utils import quaternion_to_dict


def parse_bool(val) -> bool:
    """Parse a boolean value weather in int, str, or bool"""
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        return strtobool(val)
    return bool(val)


def xxhash32_file(file_or_path):
    if hasattr(file_or_path, "read"):
        fp = file_or_path
        _close = False
    else:
        _close = True
        if not isinstance(file_or_path, Path):
            file_or_path = Path(file_or_path)
        fp = file_or_path.open("rb")

    fp.seek(0)
    xh = xxhash.xxh32()
    while True:
        s = fp.read(8096)
        if not s:
            break
        xh.update(s)

    if _close:
        fp.close()

    return xh.hexdigest()


def xxhash32(data):
    xh = xxhash.xxh32()
    xh.update(data)
    return xh.hexdigest()


def crc32(filename_or_path):
    if not isinstance(filename_or_path, Path):
        filename_or_path = Path(filename_or_path)

    with filename_or_path.open("rb") as fh:
        crc = 0
        while True:
            s = fh.read(65536)
            if not s:
                break
            crc = zlib.crc32(s, crc)
        return "%08X" % (crc & 0xFFFFFFFF)


def get_size(obj, seen=None):
    """Recursively finds size of objects"""
    size = sys.getsizeof(obj)
    if seen is None:
        seen = set()
    obj_id = id(obj)
    if obj_id in seen:
        return 0
    # Important mark as seen *before* entering recursion to gracefully handle
    # self-referential objects
    seen.add(obj_id)
    if isinstance(obj, dict):
        size += sum([get_size(v, seen) for v in obj.values()])
        size += sum([get_size(k, seen) for k in obj.keys()])
    elif hasattr(obj, "__dict__"):
        size += get_size(obj.__dict__, seen)
    elif hasattr(obj, "__iter__") and not isinstance(obj, (str, bytes, bytearray)):
        size += sum([get_size(i, seen) for i in obj])
    return size


def version_from_id_file(id_file) -> (dict, str):
    opened = False
    if isinstance(id_file, str):
        opened = True
        id_file = open(id_file, "r")

    version_data = {}
    version_label = ""
    try:
        version_data = json.loads(id_file.read()).get("Data", {})
        branch = version_data.get("Branch", None)
        version = version_data.get("RequestedP4ChangeNum", None)
        version_label = f"{branch}-{version}"
    except Exception:
        sys.stderr.write(
            f"Warning: Unable to determine version of P4K file, missing or corrupt c_win_shader.id"
        )
    finally:
        if opened:
            id_file.close()
    return version_data, version_label


def etree_to_dict(t: typing.Union[ElementTree.ElementTree, ElementTree.Element]) -> dict:
    """Convert the given ElementTree `t` to an dict following the following XML to JSON specification:
    https://www.xml.com/pub/a/2006/05/31/converting-between-xml-and-json.html

    """
    # etree<->dict conversions from
    # from https://stackoverflow.com/a/10076823

    if isinstance(t, ElementTree.ElementTree):
        t = t.getroot()

    d = {t.tag: {} if hasattr(t, "attrib") else None}
    children = list(t)
    if children:
        dd = defaultdict(list)
        for dc in map(etree_to_dict, children):
            for k, v in dc.items():
                dd[k].append(v)
        d = {t.tag: {k: v[0] if len(v) == 1 else v for k, v in dd.items()}}
    if t.attrib:
        d[t.tag].update(("@" + k, v) for k, v in t.attrib.items())
    if t.text:
        text = t.text.strip()
        if children or t.attrib:
            if text:
                d[t.tag]["#text"] = text
        else:
            d[t.tag] = text
    return d


def dict_to_etree(dict_obj: dict) -> ElementTree:
    """Convert the given dict `d` to an ElementTree following the following XML to JSON specification:
    https://www.xml.com/pub/a/2006/05/31/converting-between-xml-and-json.html
    """

    def _to_etree(d, root):
        if not d:
            pass
        elif isinstance(d, str):
            root.text = d
        elif isinstance(d, dict):
            for k, v in d.items():
                if k.startswith("#"):
                    root.text = str(v)
                elif k.startswith("@"):
                    root.set(k[1:], str(v))
                elif isinstance(v, list):
                    sub = ElementTree.SubElement(root, str(k))
                    for e in v:
                        _to_etree(e, sub)
                elif isinstance(v, dict):
                    _to_etree(v, ElementTree.SubElement(root, str(k)))
                elif isinstance(d, bool):
                    root.text = str(int(d))
                else:
                    if isinstance(v, bool):
                        v = int(v)
                    root.set(str(k), str(v))
                    # _to_etree(v, ElementTree.SubElement(root, k))
        elif isinstance(d, bool):
            root.text = str(int(d))
        else:
            root.text = str(d)
            # assert d == "invalid type", (type(d), d)

    assert isinstance(dict_obj, dict) and len(dict_obj) == 1
    tag, body = next(iter(dict_obj.items()))
    node = ElementTree.Element(tag)
    _to_etree(body, node)
    return ElementTree.ElementTree(node)


def norm_path(path: typing.Union[str, Path]) -> str:
    if isinstance(path, Path):
        path = path.as_posix()
    return path.replace("\\", "/")


def dict_search(obj: dict, keys: typing.Union[str, list], ignore_case=False):
    """returns the unique values of every key `key` within nested dict objects"""
    if not isinstance(keys, list):
        keys = [keys]
    values = set()
    for k, v in obj.items():
        if isinstance(v, dict):
            values |= dict_search(v, keys, ignore_case=ignore_case)
        elif isinstance(v, list):
            for i in v:
                if isinstance(i, dict):
                    values |= dict_search(i, keys, ignore_case=ignore_case)
        elif (ignore_case and k.lower() in keys) or (k in keys):
            # if ignore_case and k not in keys:
            #     print(f'dict search ignore-case match: {k}')
            values.add(v)
    return values


def dict_contains_value(obj: dict, values_to_check: typing.Union[str, list], ignore_case=False):
    """returns the unique values of every key `key` within nested dict objects"""
    if not isinstance(values_to_check, list):
        values_to_check = [values_to_check]

    def _vals_match(val):
        if ignore_case:
            return any(_.lower() in str(val).lower() for _ in values_to_check)
        return any(_ in val for _ in values_to_check)

    for k, v in obj.items():
        if isinstance(v, dict):
            if dict_contains_value(v, values_to_check, ignore_case=ignore_case):
                return True
        elif isinstance(v, list):
            for i in v:
                if isinstance(i, dict):
                    if dict_search(i, values_to_check, ignore_case=ignore_case):
                        return True
                if _vals_match(v):
                    return True
        elif _vals_match(v):
            return True
    return False


class StructureWithEnums:
    """Add missing enum feature to ctypes Structures."""

    _map = {}

    def __getattribute__(self, name):
        _map = ctypes.Structure.__getattribute__(self, "_map")

        value = ctypes.Structure.__getattribute__(self, name)
        if name in _map:
            classes = _map[name]
            if not isinstance(classes, (list, tuple)):
                classes = [classes]
            for enumClass in classes:
                try:
                    if isinstance(value, ctypes.Array):
                        return [enumClass(x) for x in value]
                    else:
                        return enumClass(value)
                except ValueError:
                    pass
            #else:
            #    sys.stderr.write(f'\n0x{value:x} is not valid for any of the types "{repr(classes)}"\n')
        return value

    def __str__(self):
        result = ["struct {0} {{".format(self.__class__.__name__)]
        for field in self._fields_:
            attr, attr_type = field
            if attr in self._map:
                attr_type = (
                    repr(self._map[attr]) if len(self._map[attr]) > 1 else self._map[attr].__name__
                )
            else:
                attr_type = attr_type.__name__
            value = getattr(self, attr)
            result.append("    {0} [{1}] = {2!r};".format(attr, attr_type, value))
        result.append("};")
        return "\n".join(result)

    __repr__ = __str__


class FileHeaderStructure(StructureWithEnums):
    def __getattribute__(self, item):
        val = super().__getattribute__(item)
        if item == "signature":
            return val.to_bytes(4, "little")
        return val


class NamedBytesIO(io.BytesIO):
    def __init__(self, content: bytes, name: str) -> None:
        super().__init__(content)
        self._name = name

    @property
    def name(self):
        return self._name


class SCJSONEncoder(json.JSONEncoder):
    """A :class:`JSONEncoder` which will handle _any_ element by eventually failing back to `str`. It will also:

    - Respect classes that have a `to_dict`, `to_json`, `dict` or `json` method.
    - Handle Quaternions with :func:`quaternion_to_dict`
    - Convert `set`s to `list`s
    - Path's use `as_posix`
    """

    def default(self, obj):
        if hasattr(obj, "dict"):
            return obj.dict()
        elif hasattr(obj, "to_dict"):
            return obj.to_dict()
        elif hasattr(obj, "to_json"):
            r = obj.to_json()
            if isinstance(r, str):
                return json.loads(r)
            return r
        elif hasattr(obj, "json"):
            r = obj.json()
            if isinstance(r, str):
                return json.loads(r)
            return r
        elif isinstance(obj, numpy.ndarray):
            return obj.tolist()
        elif isinstance(obj, Quaternion):
            return quaternion_to_dict(obj)
        elif isinstance(obj, set):
            return list(obj)
        elif isinstance(obj, Path):
            return obj.as_posix()
        try:
            return super().default(obj)
        except TypeError:
            return str(obj)


@contextmanager
def log_time(msg: str = "", handler: typing.Callable = print, threshold=0, finish_only=False):
    """Context manager that will log the time it took to run the inner context via the callable `handler`
    (Defaults to `print`)
    """
    if not finish_only and msg and threshold == 0:
        handler(msg)
    start_time = datetime.now()
    yield
    t = datetime.now() - start_time
    if threshold == 0 or t.total_seconds() >= threshold:
        handler(f'Finished {msg}{" " if msg else ""}in {datetime.now() - start_time}')


def search_for_data_dir_in_path(path):
    try:
        if not isinstance(path, Path):
            path = Path(path)
        return Path(*path.parts[: tuple(_.lower() for _ in path.parts).index("data") + 1])
    except ValueError:
        return ""


def generate_free_key(key, keys):
    if key not in keys:
        return key
    i = 1
    while (k := f"{key}.{i:>03}") in keys:
        i += 1
    return k
