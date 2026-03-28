import bpy
from bpy.types import Operator

from scdatatools.blender.utils import (
    fix_bones_position,
    remove_proxy_meshes,
    deselect_all,
    remove_sc_physics_proxies,
    collapse_outliner,
    select_children,
)
from scdatatools.cli.utils import track

ISOLATED_COLLECTION_NAME = "SC Isolated Source"


class RemoveProxyMeshes(Operator):
    """Removes Meshes with the "proxy" material"""

    bl_idname = "scdt.remove_proxy_meshes"
    bl_label = "Remove Proxy Meshes"

    def execute(self, context):
        if remove_proxy_meshes():
            return {"FINISHED"}
        return {"CANCELLED"}


class RemoveSCPhysicsProxies(Operator):
    """Removes SC $physics_proxy objects"""

    bl_idname = "scdt.remove_sc_physics_proxies"
    bl_label = "Remove SC Physics Proxies"

    def execute(self, context):
        if remove_sc_physics_proxies():
            return {"FINISHED"}
        return {"CANCELLED"}


class RemoveSCBBoxes(Operator):
    """Removes SC _bbox objects"""

    bl_idname = "scdt.remove_sc_bboxes"
    bl_label = "Remove SC _bbox "

    def execute(self, context):
        for obj in [_ for _ in bpy.data.objects.keys() if "_bbox" in _.lower()]:
            bpy.data.objects.remove(bpy.data.objects[obj])
        return {"FINISHED"}

class RemoveSCDesigner(Operator):
    """Removes SC _designer objects"""

    bl_idname = "scdt.remove_sc_designer"
    bl_label = "Remove SC _designer "

    def execute(self, context):
        for obj in [_ for _ in bpy.data.objects.keys() if "_designer_" in _.lower()]:
            bpy.data.objects.remove(bpy.data.objects[obj])
        return {"FINISHED"}

class RemoveSCVisArea(Operator):
    """Removes SC _bbox objects"""

    bl_idname = "scdt.remove_sc_visarea"
    bl_label = "Remove SC VisArea objects "

    def execute(self, context):
        for obj in [_ for _ in bpy.data.objects.keys() if "visarea_" in _.lower()]:
            bpy.data.objects.remove(bpy.data.objects[obj])
        return {"FINISHED"}


class IsolateSourceCollection(Operator):
    bl_idname = "scdt.isolate_source_collection"
    bl_label = "Isolate the source collection"

    def execute(self, context):
        try:
            inst = next(_ for _ in context.selected_objects if _.instance_collection is not None)
            entity_collection = bpy.data.collections.get(inst.get("entity_collection"))
            if entity_collection is None:
                return {"CANCELLED"}  # not what we were expecting
            deselect_all()

            geom_col = inst.instance_collection
            if geom_col.get("geom_collection") is None:
                return {"CANCELLED"}  # not what we were expecting

            if ISOLATED_COLLECTION_NAME in bpy.data.collections:
                isolated_collection = bpy.data.collections[ISOLATED_COLLECTION_NAME]
            else:
                isolated_collection = bpy.data.collections.new(ISOLATED_COLLECTION_NAME)
                bpy.context.scene.collection.children.link(isolated_collection)

            bpy.data.collections[geom_col["geom_collection"]].children.unlink(geom_col)
            isolated_collection.children.link(geom_col)

            geom_col["isolated"] = True

            ecl = bpy.context.window.view_layer.layer_collection.children[entity_collection.name]
            ecl.hide_viewport = True

            collapse_outliner()
            ctx = context.copy()
            ctx["area"] = next(a for a in bpy.context.screen.areas if a.type == "OUTLINER")
            ctx["selected_objects"] = geom_col.objects[0]
            bpy.ops.outliner.show_active(ctx)
            ctx["area"].tag_redraw()
        except StopIteration:
            return {"CANCELLED"}
        return {"FINISHED"}


class MakeInstanceReal(Operator):
    """Makes an imported instance "real" """

    bl_idname = "scdt.make_real"
    bl_label = "Make Instance Real"

    def execute(self, context):
        for obj in track(list(context.selected_objects), description="Making instances real"):
            if obj.instance_type == "COLLECTION" and obj.instance_collection is not None:
                deselect_all()
                obj.select_set(True)
                bpy.ops.object.duplicates_make_real(use_base_parent=True, use_hierarchy=True)
        return {"FINISHED"}


class MakeInstanceHierarchyReal(Operator):
    """Makes an imported instance "real" along with all of it's children"""

    bl_idname = "scdt.make_hierarchy_real"
    bl_label = "Make Instance Hierarchy Real"

    def execute(self, context):
        roots = [_ for _ in context.selected_objects if _.instance_collection is not None]
        instances = set()
        for root in roots:
            if root.instance_collection is None:
                continue  # we may have already made it real from another root
            deselect_all()
            select_children(root)
            instances.add(root)
            for obj in bpy.context.selected_objects:
                if obj.instance_type == "COLLECTION":
                    instances.add(obj)

        for inst in track(instances, description="Making instances real"):
            deselect_all()
            inst.select_set(True)
            bpy.ops.object.duplicates_make_real(use_base_parent=True, use_hierarchy=True)
        return {"FINISHED"}


class FixBonesPosition(Operator):
    """Fix bones position of .chr part with .skin informations"""

    bl_idname = "scdt.fix_bones_position"
    bl_label = "Fix Bones Position"

    def execute(self, context):

        if fix_bones_position():
            return {"FINISHED"}
        return {"CANCELLED"}


def register():
    bpy.utils.register_class(RemoveProxyMeshes)
    bpy.utils.register_class(RemoveSCPhysicsProxies)
    bpy.utils.register_class(RemoveSCBBoxes)
    bpy.utils.register_class(RemoveSCDesigner)
    bpy.utils.register_class(RemoveSCVisArea)
    bpy.utils.register_class(FixBonesPosition)
    bpy.utils.register_class(MakeInstanceReal)
    bpy.utils.register_class(MakeInstanceHierarchyReal)
    bpy.utils.register_class(IsolateSourceCollection)


def unregister():
    bpy.utils.unregister_class(RemoveProxyMeshes)
    bpy.utils.unregister_class(RemoveSCPhysicsProxies)
    bpy.utils.unregister_class(RemoveSCBBoxes)
    bpy.utils.unregister_class(RemoveSCDesigner)
    bpy.utils.unregister_class(RemoveSCVisArea)
    bpy.utils.unregister_class(FixBonesPosition)
    bpy.utils.unregister_class(MakeInstanceReal)
    bpy.utils.unregister_class(MakeInstanceHierarchyReal)
    bpy.utils.unregister_class(IsolateSourceCollection)
