from .common import DataCoreObject, register_strong_pointer_handler, dco_from_guid


@register_strong_pointer_handler("SAttachableComponentParams")
class AttachableComponent(DataCoreObject):
    @property
    def display_name(self):
        return self.AttachDef.properties['Localization'].properties['Name']

    @property
    def short_name(self):
        return self.AttachDef.properties['Localization'].properties['ShortName']

    @property
    def description(self):
        return self.AttachDef.properties['Localization'].properties['Description']

    @property
    def display_features(self):
        return self.AttachDef.properties['Localization'].properties['displayFeatures'].properties

    @property
    def display_type(self):
        return self.AttachDef.properties['DisplayType']

    @property
    def grade(self):
        return self.AttachDef.properties['Grade']

    @property
    def inherit_parent_manufacturer(self):
        return self.AttachDef.properties['inheritParentManufacturer']

    @property
    def inventory_occupancy_dimensions(self):
        return self.AttachDef.properties['inventoryOccupancyDimensions'].properties

    @property
    def inventory_occupancy_volume(self):
        return self.AttachDef.properties['inventoryOccupancyVolume'].properties

    @property
    def manufacturer(self):
        try:
            return dco_from_guid(self._sc, self.AttachDef.properties['Manufacturer'])
        except KeyError:
            return None

    @property
    def required_tags(self):
        return self.AttachDef.properties['RequiredTags']

    @property
    def size(self):
        return self.AttachDef.properties['Size']

    @property
    def tags(self):
        return self.AttachDef.properties['Tags'].split()

    @property
    def attachable_type(self):
        return self.AttachDef.properties['Type']

    @property
    def attachable_sub_types(self):
        return self.AttachDef.properties['SubType'].split(',')

