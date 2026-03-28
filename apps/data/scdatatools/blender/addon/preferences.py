import bpy

from .. import utils


class SCDTProperties:
    """
    Stores the variables for the addon
    """

    # ----------------- read/write variables -----------------
    pass


class SCDTUIProperties:
    """
    User configurable properties in the Add-ons preferences
    """

    default_sc_data_dir: bpy.props.StringProperty(
        name="Star Citizen Default Data Directory",
        default="",
        update=utils.auto_format_sc_data_dir_path,
        # description=(
        #     "The default base 'Data' directory containing exported assets. All imported assets will be looked "
        #     "up relative to this directory."
        # )
    )

    incorrect_sc_data_dir_folder_path: bpy.props.BoolProperty(default=False)

    # allow_scdv_override = bpy.props.BoolProperty(
    #     name='Allow StarFab to override the SC data directory when connected.',
    #     default=True,
    #     description="Allows StarFab Blender Link to override the SC data directory when blender link is connected. If "
    #                 "unselected the configured SC data directory will always be used."
    # )


class SCDTUIWindowManagerPropertyGroup(bpy.types.PropertyGroup, SCDTProperties):
    """Property group that stores constants in the window manager context"""


class SCDTSavedProperties(bpy.types.PropertyGroup):
    """Property group that stores constants in the scene context. These will get stored to the blend file."""


class SCDTPreferences(SCDTProperties, SCDTUIProperties, bpy.types.AddonPreferences):
    """
    This class creates the settings interface in the scdt addon.
    """

    bl_idname = "scdt"

    def draw(self, context, properties=None):
        """
        This defines the draw method, which is in all Blender UI types that create interfaces.
        :param context: The context of this interface.
        :param properties: The add-on properties to use.
        """
        layout = self.layout

        if not properties:
            properties = self

        # row = layout.row()
        # row.prop(properties, 'allow_scdv_override')

        # SC Data Dir
        row = layout.row()
        row.label(text="Default SC Data Dir")
        row = layout.row()
        row.alert = properties.incorrect_sc_data_dir_folder_path
        row.prop(properties, "default_sc_data_dir", text="")


def register():
    bpy.utils.register_class(SCDTUIWindowManagerPropertyGroup)
    bpy.utils.register_class(SCDTSavedProperties)

    bpy.types.WindowManager.scdt = bpy.props.PointerProperty(type=SCDTUIWindowManagerPropertyGroup)
    bpy.types.Scene.scdt = bpy.props.PointerProperty(type=SCDTSavedProperties)

    bpy.utils.register_class(SCDTPreferences)


def unregister():
    bpy.utils.unregister_class(SCDTUIWindowManagerPropertyGroup)

    del bpy.types.WindowManager.scdt
    del bpy.types.Scene.scdt

    bpy.utils.unregister_class(SCDTPreferences)


def get_scdv_pref(prop):
    return getattr(bpy.context.preferences.addons["scdt"].preferences, prop)


def set_scdv_pref(prop, value):
    return setattr(bpy.context.preferences.addons["scdt"].preferences, prop, value)
