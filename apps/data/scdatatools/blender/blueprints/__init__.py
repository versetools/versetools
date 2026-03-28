import json
import logging
import typing
from datetime import datetime
from pathlib import Path

import bpy
import mathutils
from bpy.props import StringProperty, BoolProperty, CollectionProperty, EnumProperty
from bpy.types import Operator, OperatorFileListElement
from bpy_extras.io_utils import ImportHelper

from scdatatools.blender import materials
from scdatatools.blender.blueprints import utilities as bp_utils
from scdatatools.blender.blueprints.hooks import (
    MODEL_IMPORT_HOOK,
    BLENDER_REGISTER_HOOK,
    BLENDER_UNREGISTER_HOOK,
)
from scdatatools.blender.blueprints.lighting import create_light, create_light_parent
from scdatatools.blender.blueprints.ui import (
    SCImportEntityPanel,
    SCImportEntityImportedContainersPanel,
    SCImportEntityAvailableContainersPanel,
)
from scdatatools.blender.logging import use_log_file
from scdatatools.blender.materials import load_tint_palette
from scdatatools.blender.materials.utils import tint_palette_node_group_for_entity
from scdatatools.blender.utils import (
    remove_proxy_meshes,
    deselect_all,
    copy_rotation,
    hashed_path_key,
    move_obj_to_collection,
    fix_bones_position,
)
from scdatatools.cli.utils import track
from scdatatools.engine.materials.mat_utils import normalize_material_name
from scdatatools.plugins import register_hook, plugin_manager
from scdatatools.utils import log_time

logger = logging.getLogger(__name__)

GEOM_SCENE = "StarFab"
GEOM_COLLECTION = "Data"

importers = {}
model_importers = {}


def dae_importer(geom_file: typing.Union[str, Path], data_dir: Path):
    """Used by `get_or_create_geometry` to import a Collada"""
    dae_file = (data_dir / geom_file).with_suffix(".dae")
    if not dae_file.is_file():
        logger.warning(f"Skipping entity {geom_file.stem}: dae does not exist {dae_file}")
        return False

    bpy.ops.wm.collada_import(filepath=dae_file.as_posix())
    return True


register_hook(MODEL_IMPORT_HOOK, dae_importer, label="DAE")
DEFAULT_MODEL_IMPORTER = dae_importer


def geom_collection_for_path(geom_path: Path):
    if not isinstance(geom_path, Path):
        geom_path = Path(geom_path)
    geom_parts = [GEOM_COLLECTION] + list(geom_path.parent.parts)
    if GEOM_SCENE not in bpy.data.scenes:
        bpy.data.scenes.new(name=GEOM_SCENE)
        if "ViewLayer" in bpy.data.scenes[GEOM_SCENE].view_layers:
            # in Blender 3.0 new scenes have a view layer named "ViewLayer", normalize it to how 2.93 does it
            vl = bpy.data.scenes[GEOM_SCENE].view_layers["ViewLayer"]
            vl.name = "View Layer"
    geom_scene = bpy.data.scenes[GEOM_SCENE]
    # col_view_layer = geom_scene.view_layers["View Layer"].layer_collection
    # Or you can just call it by index
    col_view_layer = geom_scene.view_layers[0].layer_collection
    col = geom_scene.collection

    cur_path = Path()
    while geom_parts:
        col_name = (
            geom_parts[0] if str(cur_path) == "." else hashed_path_key(cur_path / geom_parts[0])
        )
        if col_name not in bpy.data.collections:
            new_col = bpy.data.collections.new(col_name)
            col_name = new_col.name
            col.children.link(new_col)
            # new_col.hide_render = True
        col = bpy.data.collections[col_name]
        col_view_layer = col_view_layer.children[col.name]
        cur_path /= geom_parts.pop(0)
    return col, col_view_layer


def get_or_create_geometry(
    geom_file: Path,
    data_dir: Path = None,
    bone_names: list = None,
    helpers: dict = None,
    has_tints: bool = False,
    importer: callable = DEFAULT_MODEL_IMPORTER,
) -> typing.Tuple[object, bool]:
    """
    Returns the `Collection` for the given `geom_file`. Imports the given geometry into `geometry_collection` if it has
    not already been imported.

    :param geom_file: `geom_file` to load. This is the relative path for the geometry from the `Data` dir
    :param data_dir: Local path to the root `Data` directory
    :param bone_names: List of known "bone" names. These will be used to recreate object hierarchy in instances for
        attachment points
    :param has_tints: Whether or not the geometry has tint_palettes which will add the `tinted` flag to materials that
        are loaded in and meet the tint criteria
    :param helpers: Dictionary of `helper`s from a blueprint
    :param importer: The model importer function to use when the model needs to be loaded. Will be passed the
        (`geom_file`, `data_dir`) and should return a `bool` of whether or not it was successful. It is also expected
        that the resulting, newly imported geometry will be the new currently selected objects
    :return: The Collection for `geom_file` and a `bool` of whether or not the geometry was created
    """
    if not isinstance(geom_file, Path):
        geom_file = Path(geom_file)

    geom_key = hashed_path_key(geom_file)
    data_dir = data_dir or ""
    bone_names = bone_names or []
    if not isinstance(data_dir, Path):
        data_dir = Path(data_dir)

    geometry_collection, geom_view_layer = geom_collection_for_path(geom_file)
    if geom_key in geometry_collection.children:
        # Already loaded, return the collection
        gc = geometry_collection.children[geom_key]
        if gc["filename"].lower() != geom_file.as_posix().lower():
            if geom_file.suffix == ".chr" or Path(gc["filename"]).suffix == ".chr":
                return (
                    gc,
                    False,
                )  # if the collision is a chr, accept using the other model  # TODO: handle this better
            raise ValueError(
                f"geom_key collision! {geom_key} - "
                f"gc_filename: {gc['filename'].lower()} "
                f"geom_file: {geom_file.as_posix().lower()}"
            )
        return gc, False

    try:
        deselect_all()
        old_mats = set(bpy.data.materials.keys())
        success = importer(geom_file, data_dir)
        if not success:
            return None, False
        new_mats = set(bpy.data.materials.keys()) - old_mats
    except Exception as e:
        logger.error(f"Error during model import: {repr(e)}", exc_info=e)
        return None, False

    gc = bpy.data.collections.new(geom_key)
    geometry_collection.children.link(gc)
    # TODO: make this optional?
    # geom_view_layer.children[geom_key].hide_viewport = True
    gc["filename"] = geom_file.as_posix()
    gc["materials"] = {}
    gc["tags"] = ""
    gc["item_ports"] = {}
    gc["helpers"] = helpers or {}
    gc["objs"] = [_.name for _ in bpy.context.selected_objects]
    gc["geom_collection"] = geometry_collection.name
    root_objs = []

    # move the imported objects into the new collection and namespace their names, also
    mats_to_del = set()

    for obj_name in gc["objs"]:
        obj = bpy.data.objects[obj_name]
        move_obj_to_collection(obj, gc)
        obj["orig_name"] = obj.name.rsplit(".", maxsplit=1)[0]
        obj["source_file"] = geom_file.as_posix()
        if obj.type == "ARMATURE":
            armatureName = geom_key.rsplit(".", maxsplit=1)[0].split("_", maxsplit=1)[1]
            armatureName = hashed_path_key(Path(geom_key) / armatureName)
            obj.name = armatureName + "_armature"
            obj.data.bones.data.name = "Armature." + armatureName
        else:
            obj.name = hashed_path_key(Path(geom_key) / obj.name)
        if obj["orig_name"].lower() in bone_names:
            gc["item_ports"][obj["orig_name"].lower()] = obj.name
        if obj.parent is None:
            root_objs.append(obj)

        if obj.type == "MESH":
            obj.data.use_auto_smooth = True

            if not obj.modifiers.get("Weld"):
                obj.modifiers.new("Weld", "WELD")
                obj.modifiers["Weld"].merge_threshold = 0.000001

            if not obj.modifiers.get("Weighted Normal"):
                obj.modifiers.new("Weighted Normal", "WEIGHTED_NORMAL")
                obj.modifiers["Weighted Normal"].keep_sharp = True

            for i, slot in enumerate(obj.material_slots):
                if not slot.material:
                    continue

                norm_mat_name = normalize_material_name(slot.material.name)
                if norm_mat_name != slot.material.name:
                    if slot.material.name in new_mats:
                        new_mats.remove(slot.material.name)
                    if norm_mat_name in bpy.data.materials:
                        # we're using a duplicate name, reassign this slot and mark the 'new' duplicate mat for deletion
                        mats_to_del.add(slot.material.name)
                        slot.material = bpy.data.materials[norm_mat_name]
                    else:
                        # norm name hasnt been setup yet, just rename this material to the right name
                        slot.material.name = norm_mat_name

                verts = [v for f in obj.data.polygons if f.material_index == i for v in f.vertices]
                if verts:
                    vg = obj.vertex_groups.get(slot.material.name)
                    if vg is None:
                        vg = obj.vertex_groups.new(name=slot.material.name)
                    vg.add(verts, 1.0, "ADD")
        elif obj.type == "EMPTY":
            obj.empty_display_type = "CUBE"
            obj.empty_display_size = 0.01
            if "hardpoint" in obj.name:
                obj.show_name = False
                obj.empty_display_type = "SPHERE"
                obj.scale = (1, 1, 1)
                # obj.show_in_front = True
            elif "light" in obj.name:
                obj.empty_display_type = "SINGLE_ARROW"
            elif "$" in obj.name:
                obj.empty_display_type = "SPHERE"

    for mat in new_mats:
        if mat := bpy.data.materials.get(mat):
            norm_mat_name = normalize_material_name(mat.name)
            if norm_mat_name != mat.name:
                if norm_mat_name in bpy.data.materials:
                    mats_to_del.add(mat.name)
                else:
                    bpy.data.materials[mat.name].name = norm_mat_name

    for mat in mats_to_del:
        bpy.data.materials.remove(bpy.data.materials[mat])

    try:
        true_root = next(iter(_ for _ in root_objs if "merged" not in _.name.lower()))
    except StopIteration:
        try:
            true_root = root_objs[0]
        except IndexError:
            bpy.data.collections.remove(gc)
            return None, False
    root_objs.remove(true_root)
    gc["root_obj"] = true_root
    for obj in root_objs:
        obj.parent = true_root
        obj.matrix_world = obj.matrix_parent_inverse
    del root_objs
    true_root.rotation_mode = "QUATERNION"
    gc["orig_location"] = tuple(true_root.location)
    gc["orig_scale"] = tuple(true_root.scale)
    gc["orig_rotation_quaternion"] = tuple(true_root.rotation_quaternion)
    # apply_transform(true_root)
    true_root.location = (0, 0, 0)
    true_root.scale = (1, 1, 1)
    # true_root.rotation_quaternion = (1, 0, 0, 0)
    logger.debugscbp(f"Created geometry for {geom_file.as_posix()} as {gc.name}")

    return gc, True


def create_geom_instance(
    geom_file: Path,
    collection=None,
    location=None,
    rotation=None,
    scale=None,
    bone_name="",
    instance_name="",
    parent=None,
    loc_offset=None,
    rot_offset=None,
    *args,
    **kwargs,
):
    # get the geometry collection for the geom_file
    gc, _ = get_or_create_geometry(geom_file, *args, **kwargs)
    if gc is None:
        return None

    # ignore the auto-generated instance numbers in the BP
    inst_name = f"{instance_name}" if (instance_name and not instance_name.isdigit()) else gc.name
    new_instance = bpy.data.objects.new(inst_name, None)
    new_instance.instance_type = "COLLECTION"
    new_instance.instance_collection = gc

    # make the extra data readily available to users in the properties window for the instanced object
    new_instance["filename"] = gc["filename"]
    new_instance["materials"] = gc["materials"]
    new_instance["tags"] = gc["tags"]
    new_instance["helpers"] = gc["helpers"]
    if collection is not None:
        collection.objects.link(new_instance)

    location = (
        gc["orig_location"] if location is None else (location["x"], location["y"], location["z"])
    )
    if scale is not None:
        scale = tuple(a * b for a, b in zip(gc["orig_scale"], (scale["x"], scale["y"], scale["z"])))
    else:
        scale = gc["orig_scale"]
    # location = (0, 0, 0) if location is None else (location['x'], location['y'], location['z'])
    # scale = (1, 1, 1) if scale is None else (scale['x'], scale['y'], scale['z'])

    if isinstance(rotation, list):
        # 3x3 rotation matrix
        rot_matrix = mathutils.Matrix(rotation)
        rotation = rot_matrix.to_quaternion()
    elif isinstance(rotation, dict):
        # dict of a quaternion
        rotation = (rotation["w"], rotation["x"], rotation["y"], rotation["z"])
    else:
        rotation = (1, 0, 0, 0)

    # Duplicate the hierarchy of all the hardpoints from the collection as empty objects so we have clean
    # item_port names to attach other geometry (also makes the outliner look a lot nicer)
    pmap = {}

    def _build_hierarchy(obj):
        if obj.parent is None:
            return new_instance.name
        else:
            if obj.parent["orig_name"] in pmap:
                par = pmap[obj.parent["orig_name"]]
            else:
                par = bpy.data.objects[_build_hierarchy(obj.parent)]
        new_obj = bpy.data.objects.new(f'{obj["orig_name"]}', None)
        new_obj.parent = par
        new_obj.location = obj.location
        new_obj.scale = obj.scale
        new_obj.rotation_mode = obj.rotation_mode
        copy_rotation(obj, new_obj)
        pmap[obj["orig_name"]] = new_obj
        if collection is not None:
            collection.objects.link(new_obj)
        return new_obj.name

    new_instance["item_ports"] = {}
    for ip_name, gc_obj in gc["item_ports"].items():
        new_instance["item_ports"][ip_name] = _build_hierarchy(bpy.data.objects[gc_obj])
    del pmap

    if bone_name and parent is not None:
        if helper := parent.get("helpers", {}).get(bone_name.lower(), {}):
            bone_name = helper["name"]
            if "pos" in helper:
                location = (helper["pos"]["x"], helper["pos"]["y"], helper["pos"]["z"])
            if "scale" in helper:
                scale = (
                    helper["scale"]["x"],
                    helper["scale"]["y"],
                    helper["scale"]["z"],
                )
            if "rotation" in helper:
                rotation = (
                    helper["rotation"]["w"],
                    helper["rotation"]["x"],
                    helper["rotation"]["y"],
                    helper["rotation"]["z"],
                )
        if parent is not None and bone_name.lower() in parent.get("item_ports", {}):
            try:
                new_instance.parent = bpy.data.objects[parent["item_ports"][bone_name.lower()]]
            except KeyError:
                logger.error(
                    f"Could not find object for bone_name {bone_name}, "
                    f'expected {parent["item_ports"][bone_name.lower()]}. Assigning to parent'
                )
                new_instance.parent = parent

    new_instance.location = location
    new_instance.scale = scale
    new_instance.rotation_mode = "QUATERNION"
    # new_instance.rotation_quaternion = gc['orig_rotation_quaternion']
    new_instance.rotation_quaternion.rotate(mathutils.Quaternion(rotation))

    if loc_offset is not None:
        new_instance.location += loc_offset
    if rot_offset is not None:
        new_instance.rotation_quaternion.rotate(rot_offset)

    logger.debugscbp(f"instanced {gc.name} as {new_instance.name}")

    return new_instance


class SCBlueprintImporter:
    def __init__(
        self,
        scbp_file,
        data_dir,
        auto_import_materials=True,
        remove_physics_proxies=True,
        auto_remove_proxy_mesh=True,
        import_lighting=True,
        auto_fix_bones=True,
        model_importer: callable = DEFAULT_MODEL_IMPORTER,
    ):
        self.scbp = Path(scbp_file)
        self.bp = json.load(self.scbp.open())

        self.data_dir = data_dir
        self.auto_import_materials = auto_import_materials
        self.remove_physics_proxies = remove_physics_proxies
        self.auto_remove_proxy_mesh = auto_remove_proxy_mesh
        self.import_lighting = import_lighting
        self.auto_fix_bones = auto_fix_bones
        self.model_importer = model_importer

        self._processed_geometry = []
        self.imported_containers = []
        self.containers = []
        self._container_collections = {}

        def _walk_containers(p, base_name=""):
            for name, container in p.get("containers", {}).items():
                name = f"{base_name}{name}"
                if name not in self.containers and (
                    container.get("instances", {})
                    or container.get("lights", {})
                    or container.get("socs", [])
                ):
                    self.containers.append(name)
                _walk_containers(container, base_name=f"{name}.")

        _walk_containers(self.bp)

        self.entity_collection = bpy.data.collections.new(hashed_path_key(self.bp["name"]))
        bpy.context.scene.collection.children.link(self.entity_collection)

        # self.lighting_collection = bpy.data.collections.new(f'{self.bp["name"]}_Lighting')
        # self.entity_collection.children.link(self.lighting_collection)

        self.tint_palette_node_group = tint_palette_node_group_for_entity(
            self.entity_collection.name
        )
        self.tint_palettes = {
            Path(_).stem: (Path(self.data_dir) / _).as_posix()
            for _ in self.bp.get("tint_palettes", [])
        }
        self.default_tint_palette = [_ for _ in self.tint_palettes.keys() if "default" in _.lower()]
        self.default_tint_palette = (
            self.default_tint_palette[0] if self.default_tint_palette else ""
        )

        panel_name = self.entity_collection.name.replace("-", "")
        entity_panel_id = f"VIEW3D_PT_SCImpEnt_P_{panel_name[-40:]}"
        panels = [
            type(
                entity_panel_id,
                (SCImportEntityPanel, bpy.types.Panel),
                {
                    "bl_idname": entity_panel_id,
                    "bl_label": self.entity_collection.name,
                    "importer": self,
                },
            )
        ]

        imported_panel_id = f"VIEW3D_PT_SCImpCont_P_{panel_name[-40:]}"
        panels.append(
            type(
                imported_panel_id,
                (SCImportEntityImportedContainersPanel, bpy.types.Panel),
                {
                    "bl_idname": imported_panel_id,
                    "bl_parent_id": entity_panel_id,
                    "importer": self,
                },
            )
        )

        available_panel_id = f"VIEW3D_PT_SCAvailCont_P_{panel_name[-39:]}"
        panels.append(
            type(
                available_panel_id,
                (SCImportEntityAvailableContainersPanel, bpy.types.Panel),
                {
                    "bl_idname": available_panel_id,
                    "bl_parent_id": entity_panel_id,
                    "importer": self,
                },
            )
        )

        importers[self.entity_collection.name] = {"panels": panels, "importer": self}
        for panel in panels:
            bpy.utils.register_class(panel)

        self.entity_instance = None
        self.imported = False
        self._created_geom = []

        logger.info(f"Loaded StarFab Blueprint: {self.scbp}")
        logger.info(f"Data dir: {self.data_dir}")

    def _process_geom(self, gc, entity):
        if self.remove_physics_proxies:
            # obj name will be scoped (geom_file.orig_name)
            proxy_objs = [
                obj_name
                for obj_name in gc["objs"]
                if obj_name.split(".")[-1].lower().startswith("$physics_proxy")
            ]
            if proxy_objs:
                for obj_name in track(proxy_objs, description="Removing SC physics proxy objects"):
                    bpy.data.objects.remove(bpy.data.objects[obj_name], do_unlink=True)

        for mat in entity["materials"]:
            if not mat:
                continue
            gc["materials"][Path(mat).stem.lower()] = (self.data_dir / mat).as_posix()

        gc["tags"] = entity["attrs"].get("tags", "")
        self._processed_geometry.append(gc.name)
        self._created_geom.append(gc.name)

    def _instance_geom(self, parent, geom_name, inst_name, inst_attrs, **kwargs):
        if (entity := self.bp["geometry"].get(geom_name)) is None:
            logger.error(f'Unknown geometry "{geom_name}"')
            return None

        geom_file = Path(entity["geom_file"])
        bone_name = inst_attrs.get("attrs", {}).get("bone_name", "")
        new_instance = create_geom_instance(
            geom_file,
            location=inst_attrs.get("pos"),
            rotation=inst_attrs.get("rotation"),
            scale=inst_attrs.get("scale"),
            bone_name=bone_name,
            instance_name=inst_name,
            data_dir=self.data_dir,
            parent=parent,
            helpers=entity["helpers"],
            bone_names=self.bp["bone_names"],
            importer=self.model_importer,
            **kwargs,
        )

        if new_instance is None:
            logger.warning(f"Skipping instance: geometry not found for {geom_name}")
            return

        if new_instance.instance_collection.name not in self._processed_geometry:
            self._process_geom(new_instance.instance_collection, entity)

        if new_instance is None:
            # TODO: this _shouldn't_ happen. if it does we really should figure out why
            logger.error(
                f"ERROR: could not create instance for "
                f'{parent.get("name", "") if parent is not None else ""}:{geom_file}'
            )
            return

        if self.entity_instance is None and new_instance["filename"] == self.bp["entity_geom"]:
            self.entity_instance = new_instance
            new_instance.name = self.bp["name"]

        if new_instance.parent is None:
            if bone_name and self.entity_instance is not None:
                # could not find bone_name in parent, so double check if it's in the entity geom
                if helper := self.entity_instance["helpers"].get(bone_name.lower(), {}):
                    bone_name = helper["name"]
                if bone_name.lower() in self.entity_instance["item_ports"]:
                    new_instance.parent = bpy.data.objects[
                        self.entity_instance["item_ports"][bone_name.lower()]
                    ]
            if new_instance.parent is None:
                # if it's still none, fall back to setting the parent to the new-instance parent
                new_instance.parent = parent

        for subg_file, subg_instances in entity.get("sub_geometry", {}).items():
            for subg_attrs in subg_instances:
                self._instance_geom(new_instance, subg_file, "", subg_attrs, **kwargs)

        def _build_loadouts(parent, loadout):
            for port_name, props in loadout.items():
                if "hardpoint" in props:
                    props = self.bp["hardpoints"][props["hardpoint"]]
                for geom_name in props["geometry"]:
                    if geom_name not in self.bp["geometry"]:
                        continue
                    inst = self._instance_geom(
                        parent,
                        geom_name,
                        "",
                        {"attrs": {"bone_name": port_name}},
                        **kwargs,
                    )
                    _build_loadouts(inst, props.get("loadout", {}))

        _build_loadouts(new_instance, entity.get("loadout", {}))
        return new_instance

    def _get_cont_collection(self, name):
        if name in self._container_collections:
            return self._container_collections[name]
        if "." in name:
            parent, base_name = name.rsplit(".", maxsplit=1)
            parent = self._get_cont_collection(parent)
        elif name == "base":
            return self.entity_collection
        else:
            base_name = name
            parent = self.entity_collection
        cont_col = bpy.data.collections.new(base_name)
        parent.children.link(cont_col)
        self._container_collections[name] = cont_col
        return cont_col

    def import_container(
        self,
        name,
        containers=None,
        skip_geometry=False,
        geom_only=False,
        parent=None,
        loc_offset=None,
        rot_offset=None,
    ):
        self._created_geom = []
        container_path = name.split(".")
        container = self.bp

        for cont_name in container_path:
            container = container.get("containers", {}).get(cont_name)
            if container is None:
                break

        if not container:
            if name != "base":
                # only error if this wasnt the auto-attempt
                logger.error(f'Container "{name}" not found in blueprint')
            return []

        cont_collection = self._get_cont_collection(name)
        if (cont_root_obj := cont_collection.get("root_obj")) is None:
            if "socpak" in container.get("attrs", {}):
                cont_root_name = (
                    f'{cont_name} - {hashed_path_key(Path(container["attrs"]["socpak"]))}'
                )
            elif cont_name == "base":
                cont_root_name = f'{self.bp["name"]}'
            else:
                cont_root_name = cont_name

            cont_root = bpy.data.objects.new(cont_root_name, None)
            cont_root["socpak"] = container.get("attrs", {}).get("socpak", "")
            cont_root["container_name"] = name
            cont_root.empty_display_type = "CUBE"

            if parent is not None:
                cont_root.parent = parent

            pos = container.get("attrs", {}).get("pos", {"x": 0, "y": 0, "z": 0})
            rot = container.get("attrs", {}).get("rotation", {"w": 1, "x": 0, "y": 0, "z": 0})
            oc_loc_offset = mathutils.Vector((pos["x"], pos["y"], pos["z"]))
            oc_rot_offset = mathutils.Quaternion((rot["w"], rot["x"], rot["y"], rot["z"]))
            if loc_offset is not None:
                oc_loc_offset += loc_offset
            if rot_offset is not None:
                oc_rot_offset.rotate(rot_offset)

            cont_root.location = oc_loc_offset
            cont_root.rotation_mode = "QUATERNION"
            cont_root.rotation_quaternion.rotate(oc_rot_offset)
            cont_collection["root_obj"] = cont_root.name
            cont_collection.objects.link(cont_root)
        else:
            cont_root = bpy.data.objects.get(cont_root_obj)

        if (containers == ["all"] or name in containers) and name not in self.imported_containers:
            with log_time(f'Importing {name} container from {self.bp["name"]}', logger.info):
                if not skip_geometry:

                    def _walk_geom(cont):
                        # walks a container and all referenced geometry so we load all the required geometry before
                        # instancing. This is really only to make the loading output smoother and blender handles it a
                        # bit better
                        geom = set()
                        for k, v in cont.items():
                            if k == "socs":
                                for soc_path in v:
                                    geom.update(_walk_geom(self.bp["socs"].get(soc_path, {})))
                            elif k == "instances":
                                for geom_name in v:
                                    geom.add(geom_name)
                                    geom.update(_walk_geom(self.bp["geometry"].get(geom_name, {})))
                            elif k == "loadout":
                                for l in v.values():
                                    geom.update(_walk_geom(l))
                            elif k == "geometry":
                                for geom_name in v:
                                    geom.add(geom_name)
                                    geom.update(_walk_geom(self.bp["geometry"].get(geom_name, {})))
                            elif k == "sub_geometry":
                                for geom_name in v.keys():
                                    geom.add(geom_name)
                                    geom.update(_walk_geom(self.bp["geometry"].get(geom_name, {})))
                        return geom

                    container_geom = _walk_geom(container)
                    for geom_name in track(
                        container_geom, description=f"Importing {name} geometry", unit="g"
                    ):
                        if (entity := self.bp["geometry"].get(geom_name)) is None:
                            logger.error(f'Unknown geometry "{geom_name}"')
                            return None

                        gc, created = get_or_create_geometry(
                            geom_name,
                            self.data_dir,
                            self.bp["bone_names"],
                            entity["helpers"],
                            importer=self.model_importer,
                        )
                        if gc is None:
                            continue

                        if created:
                            self._process_geom(gc, entity)

                if not geom_only:
                    # TODO: this is a quick fix to load the new bp `socs` - reorganize this to handle things better
                    def _load_instances(cont_name, cont):
                        for geom_name, instances in track(
                            cont["instances"].items(),
                            total=len(cont["instances"]),
                            description=f"Instancing {cont_name} geometry",
                            unit="g",
                        ):
                            for i_name, inst in instances.items():
                                self._instance_geom(
                                    cont_root,
                                    geom_name,
                                    i_name,
                                    inst,
                                    collection=cont_collection,
                                )

                        if self.import_lighting:
                            lights = cont.get("lights", {})
                            for light_group_name, lights in track(
                                lights.items(),
                                total=len(lights),
                                description=f"Creating Lights",
                                unit="l",
                            ):
                                if (
                                    light_group_col := bpy.data.collections.get(light_group_name)
                                ) is None:
                                    light_group_col = bpy.data.collections.new(
                                        f'{self.bp["name"]}_LG_{light_group_name}'
                                    )
                                    cont_collection.children.link(light_group_col)
                                
                                # parent LG empty goes here
                                lg_parent = create_light_parent(
                                    f'{self.bp["name"]}_LG_{light_group_name}', 
                                    light_group_col
                                    )                                
                                lg_parent.parent=cont_root

                                for light_name, light in lights.items():
                                    try:
                                        create_light(
                                            light_name,
                                            light,
                                            light_group_col,
                                            #parent=cont_root,
                                            parent=lg_parent,
                                            data_dir=self.data_dir,
                                        )
                                    except Exception:
                                        logger.exception(
                                            f"Failed to create light {light_name} in {cont_name}"
                                        ) 

                    for soc_path in container["socs"]:
                        if soc := self.bp["socs"].get(soc_path):
                            _load_instances(soc_path, soc)
                    _load_instances(name, container)
                    self.imported_containers.append(name)

            for gc in self._created_geom:
                bpy.data.collections[gc]["container"] = name

        created_geom = self._created_geom[:]
        for child_container in container["containers"]:
            child_container = f"{name}.{child_container}"
            created_geom += self.import_container(
                child_container,
                containers,
                skip_geometry=skip_geometry,
                geom_only=geom_only,
                parent=cont_root,
            )
        return created_geom

    def import_(self, containers=None, *args, **kwargs):
        with log_time(f'Importing {self.bp["name"]}', logger.info):
            created_geom = []

            containers = containers or ["base"]
            if (
                containers != ["all"]
                and "base" not in containers
                and "base" not in self.imported_containers
            ):
                containers.insert(0, "base")
            created_geom += self.import_container("base", containers=containers[:], geom_only=True)
            created_geom += self.import_container(
                "base", containers=containers[:], skip_geometry=True
            )
            # if ['all'] == containers:
            #     created_geom += self.import_container('base', containers=containers[:], geom_only=True)
            #     created_geom += self.import_container('base', containers=containers[:], skip_geometry=True)
            # else:
            #     containers = containers or ['base']
            #     if 'base' not in containers and 'base' not in self.imported_containers:
            #         containers.insert(0, 'base')
            #
            #     for container in containers:
            #         created_geom += self.import_container(container, containers=containers[:], geom_only=True)
            #
            #     for container in containers:
            #         created_geom += self.import_container(container, containers=containers[:], skip_geometry=True)

            deselect_all()
            # for obj in created_geom:
            #     obj.select_set(True)

            if self.auto_remove_proxy_mesh:
                with log_time("Removing proxy mesh objects", logger.info):
                    remove_proxy_meshes()

            if self.auto_import_materials:
                mats_to_load = set()
                for gc in created_geom:
                    mats_to_load.update(bpy.data.collections[gc].get("materials", {}).values())
                with log_time("Loading Materials", logger.info):
                    materials.load_materials(
                        mats_to_load, self.data_dir, self.tint_palette_node_group
                    )

            if self.default_tint_palette:
                load_tint_palette(
                    self.tint_palettes[self.default_tint_palette],
                    self.tint_palette_node_group,
                    data_dir=self.data_dir,
                )

            # Only for small import, can fail with bigger. Maybe due to blender loading flow
            if self.auto_fix_bones:
                with log_time("Removing proxy mesh objects", logger.info):
                    fix_bones_position()


class ImportEntityContainer(Operator):
    """Import an additional container from an already loaded SCBP"""

    bl_idname = "scdt.import_entity_container"
    bl_label = "Import"

    entity_name: bpy.props.StringProperty(name="entity_name")
    container: bpy.props.StringProperty(name="container")

    def execute(self, context):
        if (entity := importers.get(self.entity_name)) is None:
            return {"CANCELLED"}

        entity["importer"].import_(containers=self.container.split(","))
        return {"FINISHED"}


class ImportStarFabBlueprint(Operator, ImportHelper):
    """Imports a Blueprint created from SCDT"""

    bl_idname = "scdt.import_sc_blueprint"
    bl_label = "Import SCDT Blueprint"

    files: CollectionProperty(
        name="File Path",
        type=OperatorFileListElement,
    )
    directory: StringProperty(
        subtype="DIR_PATH",
    )

    # ImportHelper mixin class uses this
    # filename_ext = ".scbp"

    filter_glob: StringProperty(
        default="*.scbp",
        options={"HIDDEN"},
        maxlen=255,  # Max internal buffer length, longer would be clamped.
    )

    import_data_dir: StringProperty(
        name="Data Dir",
        default="",
        description=(
            "The Data directory containing the assets for the selected blueprint. If blank, this will look for "
            "Data next to the blueprint"
        ),
    )

    remove_physics_proxies: BoolProperty(
        name="Auto-remove Physics Proxies",
        description="Automatically remove '$physics_proxy' objects after import",
        default=False,
    )

    auto_import_materials: BoolProperty(
        name="Auto-import Materials",
        description="Automatically import and fixup all referenced material files from the blueprint",
        default=True,
    )

    auto_remove_proxy_mesh: BoolProperty(
        name="Auto-remove Proxy Meshes",
        description="Automatically remove proxy meshes",
        default=False,
    )

    auto_import_lighting: BoolProperty(
        name="Auto-import lighting",
        description="Automatically import lighting",
        default=True,
    )

    import_all_containers: BoolProperty(
        name="Import All Containers",
        description="Automatically import all containers",
        default=True,
    )

    auto_fix_bones: BoolProperty(
        name="Auto-fix bones",
        description="Automatically fix bones position.\nOnly for small import, can fail with bigger",
        default=False,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def invoke(self, context, event):
        return super().invoke(context, event)

    def execute(self, context):
        bp_file = Path(self.filepath)
        data_dir = (
            Path(self.import_data_dir) if self.import_data_dir else bp_file.parent / "Data"
        ).absolute()
        if not data_dir.is_dir():
            logger.error(f'Could not determine Data directory for blueprint "{bp_file}"')
            return {"CANCELLED"}

        # TODO: "Default" will get the first one, update this to use plugin settings
        model_importer = model_importers.get(
            self.model_importer, next(iter(model_importers.values()))
        )

        with use_log_file(
            bp_file.parent
            / f'{bp_file.stem}_{datetime.now().strftime("%Y_%m_%d-%H_%M_%S")}.blender_import.log'
        ):
            try:
                importer = SCBlueprintImporter(
                    self.filepath,
                    data_dir=data_dir,
                    auto_import_materials=self.auto_import_materials,
                    remove_physics_proxies=self.remove_physics_proxies,
                    auto_remove_proxy_mesh=self.auto_remove_proxy_mesh,
                    import_lighting=self.auto_import_lighting,
                    auto_fix_bones=self.auto_fix_bones,
                    model_importer=model_importer,
                )
                if importer.import_(containers=["all"] if self.import_all_containers else None):
                    return {"FINISHED"}
            except Exception as e:
                logging.exception(f"Failed to import SCBP", exc_info=e)
        return {"CANCELLED"}


def menu_func_import(self, context):
    self.layout.operator(ImportStarFabBlueprint.bl_idname, text=ImportStarFabBlueprint.bl_label)


def menu_scdt_blueprint_outliner(self, context):
    if any(obj.instance_collection is not None for obj in context.selected_ids):
        self.layout.separator()
        self.layout.operator("scdt.make_real", text="Make Instance Real")
        self.layout.operator("scdt.make_hierarchy_real", text="Make Instance Hierarchy Real")
        self.layout.operator("scdt.isolate_source_collection", text="Isolate Source Collection")


def menu_scdt_blueprint_outliner_collection(self, context):
    if any(obj.get("instanced") for obj in context.selected_ids):
        self.layout.separator()
        self.layout.operator(
            "scdt.return_isolated_source_collections", text="Return Isolated Sources"
        )


def register():
    global model_importers
    bp_utils.register()

    bpy.utils.register_class(ImportEntityContainer)
    bpy.types.OUTLINER_MT_object.append(menu_scdt_blueprint_outliner)
    bpy.types.OUTLINER_MT_collection.append(menu_scdt_blueprint_outliner_collection)
    bpy.types.TOPBAR_MT_file_import.append(menu_func_import)

    for entity, importer_info in importers.items():
        for panel in importer_info["panel"]:
            bpy.utils.register_class(panel)

    for hook_name, hook in plugin_manager.hooks(BLENDER_REGISTER_HOOK):
        logger.debugscbp(f"Registering blender hook {hook_name}")
        try:
            hook["handler"]()
        except Exception:
            logger.exception(f"Failed to register Blender scdt plugin {hook_name}")

    # build up model importer choices now that plugins have loaded
    model_importer_enums = [("Default", "Default", "")]
    for hook_name, hook in plugin_manager.hooks(MODEL_IMPORT_HOOK):
        name = hook["kwargs"].get("label")
        if not name or name in model_importers:
            logger.warning(
                f'Invalid model importer handler {hook_name} {hook["kwargs"]} - a unique `name` is required'
            )
            continue
        model_importers[name] = hook["handler"]
        model_importer_enums.append((name, name, hook["kwargs"].get("description", "")))

    ImportStarFabBlueprint.__annotations__.update(
        {
            "model_importer": EnumProperty(
                name="Model Importer",
                items=model_importer_enums,
                default=model_importer_enums[0][0],
            )
        }
    )
    bpy.utils.register_class(ImportStarFabBlueprint)


def unregister():
    for name, hooks in plugin_manager.hooks(BLENDER_UNREGISTER_HOOK):
        logger.debugscbp(f"Unregistering blender hook {name}")
        try:
            hooks["handler"]()
        except Exception:
            logger.exception(f"Failed to unregister Blender scdt plugin {name}")

    bpy.utils.unregister_class(ImportStarFabBlueprint)
    bpy.utils.unregister_class(ImportEntityContainer)
    bpy.types.OUTLINER_MT_object.remove(menu_scdt_blueprint_outliner)
    bpy.types.OUTLINER_MT_collection.remove(menu_scdt_blueprint_outliner_collection)
    bpy.types.TOPBAR_MT_file_import.remove(menu_func_import)

    for entity, importer_info in importers.items():
        for panel in reversed(importer_info["panels"]):
            bpy.utils.unregister_class(panel)
    bp_utils.unregister()
