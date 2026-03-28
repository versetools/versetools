import typing
from pathlib import Path

from scdatatools.engine.gfx import GFX
from scdatatools.sc.blueprints.processors import filetype_processor
from scdatatools.utils import norm_path

if typing.TYPE_CHECKING:
    from scdatatools.p4k import P4KInfo
    from scdatatools.sc.blueprints import Blueprint


@filetype_processor("gfx")
def process_gfx(bp: "Blueprint", path: str, p4k_info: "P4KInfo", *args, **kwargs) -> bool:
    """
    Extracts the images used in a GFX object and adds them to the blueprint. The layer order will be maintained
    and represented in the Blueprint's `asset_info` for the given path
    """
    raw = bp.sc.p4k.open(p4k_info).read()
    gfx_path = Path(p4k_info.filename)
    gfx = GFX(raw)
    assets = {}
    for layer, asset_path in gfx.assets.items():
        asset_path = (gfx_path.parent / asset_path).resolve()
        try:
            asset = next(iter(bp.sc.p4k.search(str(asset_path), mode="startswith")))
            assets[layer] = norm_path(asset.filename)
            bp.add_file_to_extract(asset.filename)
        except StopIteration:
            continue
    if assets:
        bp.asset_info[norm_path(p4k_info.filename)] = assets

    return True
