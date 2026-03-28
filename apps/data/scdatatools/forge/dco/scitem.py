from .common import DataCoreRecordObject, register_record_handler


@register_record_handler("SCItemManufacturer")
class Manufacturer(DataCoreRecordObject):
    def __init__(self, datacore, guid):
        super().__init__(datacore, guid)
        assert self.object.type == "SCItemManufacturer"

    @property
    def display_name(self):
        return self.object.properties['Localization'].properties['Name']

    @property
    def short_name(self):
        return self.object.properties['Localization'].properties['ShortName']

    @property
    def description(self):
        return self.object.properties['Localization'].properties['Description']

    @property
    def logo(self):
        return self.object.properties['Logo']

    @property
    def code(self):
        return self.object.properties['Code']
