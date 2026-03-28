import shutil

from .dds import unsplit_dds, collect_and_unsplit, is_glossmap, is_normals
from .converter import convert_buffer, tex_convert, ConverterUtility


DDS_CONV_FALLBACK = "png"
DDS_CONV_FORMAT = {"linux": "png", "darwin": "png", "win32": "tif"}
