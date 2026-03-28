from . import DataCoreBinary
from .dftypes import GUID


class Tag:
    def __init__(self, name, guid, record, database, legacyGUID=None, parent=None):
        self.name = name
        self.guid = str(guid)
        self.record = record
        self.database = database
        self.children = []
        self.children_by_name = {}
        self.legacyGUID = legacyGUID
        self.parent = parent

    def __repr__(self):
        return f"<Tag {self.name} parent:{self.parent} guid:{self.guid}>"

    def __str__(self):
        if self.parent is not None:
            return f"{self.parent}.{self.name}"
        return self.name


class TagDatabase:
    def __init__(self, dcb: DataCoreBinary):
        self.dcb = dcb
        root_record = [_ for _ in self.dcb.records if _.type == "TagDatabase"]
        if len(root_record) != 1:
            raise ValueError(
                f"Could not determine the TagDatabase record from the provided DataCoreBinary"
            )
        root_record = root_record[0]
        self.root_tag = Tag(root_record.name, root_record.id, root_record, self)
        self.tags_by_guid = {self.root_tag.guid: self.root_tag}
        for tag in root_record.properties["tags"]:
            self.create_tag_from_record(tag.value, self.root_tag)

    def all(self):
        return self.tags_by_guid.values()

    def tag_names(self):
        return sorted(str(_) for _ in self.all())

    def tag(self, name):
        parts = name.split(".")
        tag = None
        for part in parts:
            if part == "TagDatabase":
                tag = self.root_tag
            elif tag is not None:
                tag = tag.children_by_name.get(part)
        return tag

    def create_tag_from_record(self, tag_record, parent=None):
        parent = parent or self.root_tag

        if isinstance(tag_record, (str, GUID)):
            tag_record = self.dcb.records_by_guid[str(tag_record)]
        assert tag_record.type == "Tag"

        if str(tag_record.id) in self.tags_by_guid:
            tag = self.tags_by_guid[str(tag_record.id)]
        else:
            tag = Tag(
                tag_record.properties["tagName"],
                tag_record.id,
                tag_record,
                database=self,
                legacyGUID=tag_record.properties.get("legacyGUID"),
                parent=parent,
            )
            self.tags_by_guid[tag.guid] = tag
            for child in tag_record.properties["children"]:
                self.create_tag_from_record(child.value, tag)

        if tag.name not in parent.children_by_name:
            parent.children.append(tag)
            parent.children_by_name[tag.name] = tag

    def __repr__(self):
        return f"<TagDatabase guid:{self.root_tag.guid} tags:{len(self.tags_by_guid)}>"
