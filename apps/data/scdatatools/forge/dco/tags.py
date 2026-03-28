from .common import DataCoreRecordObject, register_record_handler


@register_record_handler("Tag")
class Tag(DataCoreRecordObject):
    def __init__(self, datacore, tag_guid):
        super().__init__(datacore, tag_guid)
        assert self.object.type == "Tag"

    @property
    def name(self):
        return self.object.properties["tagName"]

    @property
    def legacy_guid(self):
        return self.object.properties["legacyGUID"]

    @property
    def children(self):
        return [Tag(self._datacore, t.name) for t in self.object.properties["children"]]
