import bpy


SC_ENTITY_PANEL = []


class SCImportEntityPanel(bpy.types.Panel):
    bl_label = "SC Models"
    bl_idname = "VIEW3D_PT_SCImportEntity_Panel"
    bl_category = "SC"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_context = ""

    def draw(self, context):
        for panel in SC_ENTITY_PANEL:
            panel(self, context)


class SCImportEntityImportedContainersPanel(bpy.types.Panel):
    bl_label = "Imported Containers"
    bl_idname = "VIEW3D_PT_SCImportedContainers_Panel"
    bl_category = "SC"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_parent_id = "VIEW3D_PT_SCImportEntity_Panel"
    bl_context = ""

    def draw(self, context):
        layout = self.layout        
        for container in sorted(self.importer.imported_containers):
            layout.row().label(text=container)


class SCImportEntityAvailableContainersPanel(bpy.types.Panel):
    bl_label = "Available Containers"
    bl_idname = "VIEW3D_PT_SCAvailableContainers_Panel"
    bl_category = "SC"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_parent_id = "VIEW3D_PT_SCImportEntity_Panel"
    bl_context = ""
    
    def draw(self, context):
        available = set(self.importer.containers) - set(self.importer.imported_containers)
        for container in sorted(available):
            row = self.layout.row()
            row.label(text=container)
            op = row.operator(
                "scdt.import_entity_container", icon="IMPORT", text=''
            )
            op.entity_name = self.importer.entity_collection.name
            op.container = container
                            
        if available:
            self.layout.separator()
            op = self.layout.row().operator("scdt.import_entity_container", text=f"Import All")
            op.entity_name = self.importer.entity_collection.name
            op.container = ",".join(available)
