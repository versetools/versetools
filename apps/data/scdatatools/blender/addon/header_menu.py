# Copyright Epic Games, Inc. All Rights Reserved.
import bpy


class TOPBAR_MT_SCImport(bpy.types.Menu):
    """
    This defines a new class that will be the menu, "Import".
    """

    bl_idname = "TOPBAR_MT_SCImport"
    bl_label = "Import"

    def draw(self, context):
        self.layout.operator("scdt.import_sc_blueprint")
        self.layout.operator("scdt.import_material")


class TOPBAR_MT_SCUtilities(bpy.types.Menu):
    """
    This defines a new class that will be the menu, "Utilities".
    """

    bl_idname = "TOPBAR_MT_SCUtilities"
    bl_label = "Utilities"

    def draw(self, context):
        self.layout.operator("scdt.remove_sc_physics_proxies")
        self.layout.operator("scdt.remove_proxy_meshes")
        self.layout.operator("scdt.remove_sc_bboxes")
        self.layout.operator("scdt.remove_sc_visarea")
        self.layout.operator("scdt.fix_bones_position")
        self.layout.operator("scdt.load_sc_shader_nodes")
        self.layout.operator("scdt.make_real")


class TOPBAR_MT_SCModding(bpy.types.Menu):
    """
    This defines a new class that will be the top most parent menu, "SCModding".
    All the other action menu items are children of this.
    """

    bl_idname = "TOPBAR_MT_SCModding"
    bl_label = "SC Modding"

    def draw(self, context):
        pass


def modding_menu(self, context):
    """
    This function creates the modding menu item. This will be referenced in other functions
    as a means of appending and removing it's contents from the top bar editor class
    definition.

    :param object self: This refers the the Menu class definition that this function will
    be appended to.
    :param object context: This parameter will take the current blender context by default,
    or can be passed an explicit context.
    """
    self.layout.menu(TOPBAR_MT_SCModding.bl_idname)


def import_menu(self, context):
    """
    This function creates the import menu item. This will be referenced in other functions
    as a means of appending and removing it's contents from the top bar editor class
    definition.

    :param object self: This refers the the Menu class definition that this function will
    be appended to.
    :param object context: This parameter will take the current blender context by default,
    or can be passed an explicit context.
    """
    self.layout.menu(TOPBAR_MT_SCImport.bl_idname)


def utilities_menu(self, context):
    """
    This function creates the utilities menu item. This will be referenced in other functions
    as a means of appending and removing it's contents from the top bar editor class
    definition.

    :param object self: This refers the the Menu class definition that this function will
    be appended to.
    :param object context: This parameter will take the current blender context by default,
    or can be passed an explicit context.
    """
    self.layout.menu(TOPBAR_MT_SCUtilities.bl_idname)


def add_modding_menu():
    """
    This function adds the Parent "SCModding" menu item by appending the modding_menu()
    function to the top bar editor class definition.
    """

    if not hasattr(bpy.types, TOPBAR_MT_SCModding.bl_idname):
        bpy.utils.register_class(TOPBAR_MT_SCImport)
        bpy.utils.register_class(TOPBAR_MT_SCUtilities)
        bpy.utils.register_class(TOPBAR_MT_SCModding)
        bpy.types.TOPBAR_MT_editor_menus.append(modding_menu)

        bpy.types.TOPBAR_MT_SCModding.append(import_menu)
        bpy.types.TOPBAR_MT_SCModding.append(utilities_menu)


def remove_modding_menu():
    """
    This function removes the Parent "SCModding" menu item by removing the modding_menu()
    function from the top bar editor class definition.
    """
    if hasattr(bpy.types, TOPBAR_MT_SCModding.bl_idname):
        bpy.utils.unregister_class(TOPBAR_MT_SCImport)
        bpy.utils.unregister_class(TOPBAR_MT_SCUtilities)
        bpy.utils.unregister_class(TOPBAR_MT_SCModding)
        bpy.types.TOPBAR_MT_editor_menus.remove(modding_menu)
