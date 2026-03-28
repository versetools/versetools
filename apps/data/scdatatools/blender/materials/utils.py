import logging
from pathlib import Path

import bpy

from scdatatools.blender.utils import hashed_path_key

logger = logging.getLogger(__name__)

SCSHARDERS_BLEND = Path(__file__).parent / "SCShaders.blend"
REQUIRED_SHADER_NODE_GROUPS = [    
    ".IES mapping",
    "_Parallax (UV)",
    "_TintDecalConverter",
    "_Glass",
    "_HardSurface",
    "_Illum",
    "_Illum.decal",
    "_Illum.emit",
    "_Illum.pom",
    "_DisplayScreen",
    "_LayerBlend",
    "_LayerMix",
    "_MaterialLayer",
    "_Hologramcig",
    "_HumanSkin_V2",
    "_Organic",
    "_UIPlane"    
]


def ensure_node_groups_loaded() -> bool:
    if not SCSHARDERS_BLEND.is_file():
        return False

    for ng in REQUIRED_SHADER_NODE_GROUPS:
        if ng not in bpy.data.node_groups:
            ng_file = SCSHARDERS_BLEND / "NodeTree" / ng
            try:
                bpy.ops.wm.append(
                    filepath=ng_file.as_posix(),
                    directory=ng_file.parent.as_posix(),
                    filename=ng,
                )
                logger.debug(f"Loaded SC Shader node group - {ng}")
            except Exception as e:
                logger.exception(f'Failed to load SC Shader "{ng}"', exc_info=e)
    return True


def tint_palette_node_group_for_entity(entity_name):
    tint_group_name = hashed_path_key(f"{entity_name}_Tint")
    if entity_name in bpy.data.node_groups:
        return bpy.data.node_groups[entity_name]

    ensure_node_groups_loaded()

    tint_group = bpy.data.node_groups.new(tint_group_name, "ShaderNodeTree")
    tint_group['Type'] = 'tint_palette'
    outputs = {
        "Decal Color": "NodeSocketColor",
        "Decal Alpha": "NodeSocketFloatFactor",
        "Primary": "NodeSocketColor",
        "Primary SpecColor": "NodeSocketColor",
        "Primary Glossiness": "NodeSocketFloatFactor",
        "Secondary": "NodeSocketColor",
        "Secondary SpecColor": "NodeSocketColor",
        "Secondary Glossiness": "NodeSocketFloatFactor",
        "Tertiary": "NodeSocketColor",
        "Tertiary SpecColor": "NodeSocketColor",
        "Tertiary Glossiness": "NodeSocketFloatFactor",
        "Glass Color": "NodeSocketColor",
    }

    tint_output_group = tint_group.nodes.new("NodeGroupOutput")
    tint_output_group.name = "Outputs"
    for output, out_type in outputs.items():
        tint_group.outputs.new(out_type, output)
        if out_type == "NodeSocketFloatFactor":
            tint_group.outputs[output].default_value = 0
            tint_group.outputs[output].min_value = 0
            tint_group.outputs[output].max_value = 1
        elif out_type == "NodeSocketColor":
            tint_group.outputs[output].default_value = (1, 1, 1, 1)

    tint_output_group.location = (500, 0)

    decal_tex = tint_group.nodes.new("ShaderNodeTexImage")
    decal_tex.name = "Decal"
    decal_tex.location = (0, 0)

    if "_TintDecalConverter" in bpy.data.node_groups:
        tex_conv_group = tint_group.nodes.new(type="ShaderNodeGroup")
        tex_conv_group.name = "DecalConverter"
        tex_conv_group.node_tree = bpy.data.node_groups["_TintDecalConverter"]
        tex_conv_group.location = (300, 0)
        tint_group.links.new(decal_tex.outputs["Color"], tex_conv_group.inputs["Image"])
        tint_group.links.new(decal_tex.outputs["Alpha"], tex_conv_group.inputs["Alpha"])
        tint_group.links.new(
            tex_conv_group.outputs["Color"], tint_output_group.inputs["Decal Color"]
        )
        tint_group.links.new(
            tex_conv_group.outputs["Alpha"], tint_output_group.inputs["Decal Alpha"]
        )

    return bpy.data.node_groups[tint_group_name]


def image_for_texture(tex_path, data_dir) -> bpy.types.Image:
    """
    Finds the appropriate on-disk file for a given texture path. This resolves `.dds` texture paths to their converted
    formats, either `png`, `tif`, or `tga` (searched for in that order), and returns the Blender image, creating it if
    necessary.

    :param tex_path: Texture path
    :param data_dir: The data directory to use as the base path that `tex_path` is relative to
    :raises:
        FileNotFoundException: If not converted file could be found
    :return: `Path` of the found converted texture
    """
    tex_path = data_dir / tex_path
    if (tex_path := tex_path.with_suffix(".png")).is_file():
        pass
    elif (tex_path := tex_path.with_suffix(".tif")).is_file():
        pass
    elif (tex_path := tex_path.with_suffix(".tga")).is_file():
        pass
    if not tex_path.is_file():
        raise FileNotFoundError()

    if (tex_key := hashed_path_key(tex_path)) not in bpy.data.images:
        logger.debugscbp("loading texture %s", tex_path.as_posix())
        img = bpy.data.images.load(tex_path.as_posix())
        img.name = tex_key
    return bpy.data.images.get(tex_key)


def create_light_texture(texture: Path):
    texture = texture.with_suffix(".tga")
    if texture.with_suffix(".png").is_file():
        texture = texture.with_suffix(".png")
    elif texture.with_suffix(".tif").is_file():
        texture = texture.with_suffix(".tif")

    if not texture.is_file():
        print(f"Could not find light texture {texture}")
        return None
    
    tex_node_name = hashed_path_key(texture)
    if tex_node_name in bpy.data.node_groups:
        return bpy.data.node_groups[tex_node_name]

    new_node = bpy.data.node_groups.new(tex_node_name, "ShaderNodeTree")
    new_node_output = new_node.nodes.new("NodeGroupOutput")
    new_node.outputs.new("NodeSocketColor", "Color")
    new_node.outputs.new("NodeSocketFloat", "Strength")
    new_node_output.location = (928, -116)

    new_node_input = new_node.nodes.new("NodeGroupInput")
    new_node.inputs.new("NodeSocketColor", "Color")
    new_node.inputs["Color"].default_value = (1, 1, 1, 1)
    new_node.inputs.new("NodeSocketFloat", "Angle")
    new_node.inputs["Angle"].default_value = 180
    new_node_input.location = (-309, -251)

    mix_node = new_node.nodes.new(type="ShaderNodeMixRGB")
    mix_node.inputs[0].default_value = 1.0
    mix_node.blend_type = "MULTIPLY"
    mix_node.location = (734, -116)

    mix_up_node = new_node.nodes.new(type="ShaderNodeMixRGB")
    mix_up_node.inputs[0].default_value = 1.0
    mix_up_node.blend_type = "MULTIPLY"
    mix_up_node.location = (522, 0)

    #falloff_node = new_node.nodes.new(type="ShaderNodeLightFalloff")
    #falloff_node.location = (520, -260)

    multiply_node = new_node.nodes.new(type="ShaderNodeMath")
    multiply_node.location = (520, -260)
    multiply_node.operation = "MULTIPLY"
    multiply_node.inputs[1].default_value = 1

    new_node_texture = new_node.nodes.new("ShaderNodeTexImage")
    new_node_texture.location = (154, 212)
    new_node_texture.image = bpy.data.images.get(texture.name) or bpy.data.images.load(
        texture.as_posix()
    )
    new_node_texture.extension = "CLIP"
    new_node_texture.image.colorspace_settings.name = "sRGB"

    ensure_node_groups_loaded()
    new_node_IES_mapping = new_node.nodes.new("ShaderNodeGroup")
    new_node_IES_mapping.node_tree = bpy.data.node_groups['.IES mapping']

    new_node_texcoord = new_node.nodes.new("ShaderNodeTexCoord")
    new_node_texcoord.location = (-309,0)

    new_node.links.new(mix_node.outputs["Color"], 
                       new_node_output.inputs["Color"])
    new_node.links.new(new_node_texture.outputs["Color"], 
                       mix_up_node.inputs["Color1"])
    new_node.links.new(new_node_input.outputs["Color"], 
                       mix_node.inputs["Color2"])
    new_node.links.new(new_node_input.outputs["Angle"],
                       new_node_IES_mapping.inputs["Angle"])
    new_node.links.new(new_node_IES_mapping.outputs["Up"],
                       mix_up_node.inputs["Color2"])
    new_node.links.new(mix_up_node.outputs["Color"],
                       mix_node.inputs["Color1"])                       
    new_node.links.new(new_node_texcoord.outputs["Normal"], 
                       new_node_IES_mapping.inputs["Vector"])
    new_node.links.new(new_node_IES_mapping.outputs["Vector"], 
                       new_node_texture.inputs["Vector"])
    #new_node.links.new(new_node_texture.outputs["Color"], 
    #                   falloff_node.inputs[0])
    #new_node.links.new(falloff_node.outputs["Quadratic"], 
    #                   new_node_output.inputs["Strength"])
    new_node.links.new(new_node_texture.outputs["Color"], 
                       multiply_node.inputs[0])
    new_node.links.new(multiply_node.outputs[0], 
                       new_node_output.inputs["Strength"])
    return new_node
