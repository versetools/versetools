import ctypes
import enum
import struct
from ctypes import LittleEndianStructure
from functools import cached_property

from .enums import *
from .utils import AttrDict

DCB_NO_PARENT = 0xFFFFFFFF


# TODO: come up with a DataCoreObject interface for all the "objects" you'll run across in the datacore (e.g. Records,
#       StructureInstances, etc. Anything with a `type`?)


class DataCoreBase(LittleEndianStructure):
    @property
    def dcb(self):
        if self._b_base_ is not None:
            return getattr(self._b_base_, "_dcb")
        return getattr(self, "_dcb")

# In Datacore v6 all inheritors of this class utilize the newly added lookup table. I'm going to make a lazy edit here
# for demonstration purposes, but we should probably add a means to determine which one to look up into from the version
# if we don't just end up unifying the lookup.
class DataCoreNamed(DataCoreBase):
    @property
    def name(self):
        return self.dcb.string_for_offset2(self.name_offset)


class DataCoreHeader(DataCoreBase):
    _fields_ = [
        ("unknown0", ctypes.c_uint32),
        ("version", ctypes.c_uint32),
        ("unknown1", ctypes.c_uint16),
        ("unknown2", ctypes.c_uint16),
        ("unknown3", ctypes.c_uint16),
        ("unknown4", ctypes.c_uint16),
        ("structure_definition_count", ctypes.c_uint32),
        ("property_definition_count", ctypes.c_uint32),
        ("enum_definition_count", ctypes.c_uint32),
        ("data_mapping_definition_count", ctypes.c_uint32),
        ("record_definition_count", ctypes.c_uint32),
        ("boolean_count", ctypes.c_uint32),
        ("int8_count", ctypes.c_uint32),
        ("int16_count", ctypes.c_uint32),
        ("int32_count", ctypes.c_uint32),
        ("int64_count", ctypes.c_uint32),
        ("uint8_count", ctypes.c_uint32),
        ("uint16_count", ctypes.c_uint32),
        ("uint32_count", ctypes.c_uint32),
        ("uint64_count", ctypes.c_uint32),
        ("float_count", ctypes.c_uint32),
        ("double_count", ctypes.c_uint32),
        ("guid_count", ctypes.c_uint32),
        ("string_count", ctypes.c_uint32),
        ("locale_count", ctypes.c_uint32),
        ("enum_count", ctypes.c_uint32),
        ("strong_value_count", ctypes.c_uint32),
        ("weak_value_count", ctypes.c_uint32),
        ("reference_count", ctypes.c_uint32),
        ("enum_option_name_count", ctypes.c_uint32),
        ("text_length", ctypes.c_uint32),
        # TODO: come up with a better way of handling this in case it's legacy, previously empty field unknown6
        ("text_length2", ctypes.c_uint32),
    ]


class StructureDefinition(DataCoreNamed):
    _fields_ = [
        ("name_offset", ctypes.c_uint32),
        ("parent_index", ctypes.c_uint32),
        ("property_count", ctypes.c_uint16),
        ("first_property_index", ctypes.c_uint16),
        ("node_type", ctypes.c_uint32),
    ]

    def __repr__(self):
        return (
            f'<Struct {self.name} parent:{"None" if self.parent is None else self.parent.name} '
            f"props:{self.property_count} type:{self.node_type}>"
        )

    def __str__(self):
        return (
            f'struct:{self.name}_parent:{"None" if self.parent is None else self.parent.name}_'
            f"props:{self.property_count}_type:{self.node_type}"
        )

    @property
    def parent(self):
        return (
            None
            if self.parent_index == DCB_NO_PARENT
            else self.dcb.structure_definitions[self.parent_index]
        )

    @property
    def properties(self):
        props = self.dcb.property_definitions[
            self.first_property_index : self.first_property_index + self.property_count
        ]
        if self.parent_index != DCB_NO_PARENT:
            props = self.dcb.structure_definitions[self.parent_index].properties + props
        return props

    @property
    def calculated_data_size(self):
        size = 0
        for prop in self.properties:
            if prop.conversion_type != ConversionTypes.Attribute:
                size += ctypes.sizeof(DATA_TYPE_LOOKUP[DataTypes.ArrayPointer])
            else:
                size += prop.calculated_data_size
        return size


class PropertyDefinition(DataCoreNamed):
    _fields_ = [
        ("name_offset", ctypes.c_uint32),
        ("structure_index", ctypes.c_uint16),
        ("data_type", ctypes.c_uint16),
        ("conversion_type", ctypes.c_uint16),
        ("padding", ctypes.c_uint16),
    ]

    def __repr__(self):
        return (
            f"<PropertyDef {self.name} struct:{self.dcb.structure_definitions[self.structure_index].name} "
            f"type:{DataTypes(self.data_type).name} conv:{ConversionTypes(self.conversion_type).name}>"
        )

    def __str__(self):
        return (
            f"propertyDef:{self.name}_struct:{self.dcb.structure_definitions[self.structure_index].name}_"
            f"type:{DataTypes(self.data_type).name}_conv:{ConversionTypes(self.conversion_type).name}"
        )

    @property
    def calculated_data_size(self):
        if self.data_type == DataTypes.Class:
            return self.type_def.calculated_data_size
        return ctypes.sizeof(self.type_def)

    @property
    def type_def(self):
        if self.data_type in DATA_TYPE_LOOKUP:
            return DATA_TYPE_LOOKUP[self.data_type]
        elif self.data_type == DataTypes.Class:
            return self.dcb.structure_definitions[self.structure_index]
        raise TypeError(f"data_type not implemented: {self.data_type}")


class EnumDefinition(DataCoreNamed):
    _fields_ = [
        ("name_offset", ctypes.c_uint32),
        ("value_count", ctypes.c_uint16),
        ("first_value_index", ctypes.c_uint16),
    ]

    @property
    def enum(self):
        return enum.Enum(
            self.name,
            [
                self.dcb.values[DataTypes.EnumValueName][_].value
                for _ in range(self.first_value_index, self.first_value_index + self.value_count)
            ],
        )

# Utilizes reference string lookup table, can likely just use StringReference if no other classes are reliant on this.
class EnumChoice(DataCoreBase):
    _fields_ = [("enum_choice_index", ctypes.c_uint32)]

    @property
    def value(self):
        return self.dcb.string_for_offset(self.enum_choice_index)


class DataMappingDefinition16(DataCoreBase):
    _fields_ = [
        ("structure_count", ctypes.c_uint16),
        ("structure_index", ctypes.c_uint16),
    ]

    def __repr__(self):
        return f"<DataMap structure:{self.structure_index} count:{self.structure_count}>"

    def __str__(self):
        return f"dataMap:{self.structure_index}_count:{self.structure_count}"


class DataMappingDefinition32(DataCoreBase):
    _fields_ = [
        ("structure_count", ctypes.c_uint32),
        ("structure_index", ctypes.c_uint32),
    ]

    def __repr__(self):
        return f"<DataMap structure:{self.structure_index} count:{self.structure_count}>"

    def __str__(self):
        return f"dataMap:{self.structure_index}_count:{self.structure_count}"


class GUID(DataCoreBase):
    _fields_ = [("raw_guid", ctypes.c_byte * 16)]

    @property
    def value(self):
        c, b, a, k, j, i, h, g, f, e, d = struct.unpack("<HHI8B", self.raw_guid)
        return f"{a:08x}-{b:04x}-{c:04x}-{d:02x}{e:02x}-{f:02x}{g:02x}{h:02x}{i:02x}{j:02x}{k:02x}"

    def __repr__(self):
        return f"<GUID: {self.value}>"

    def __str__(self):
        return self.value


class StructureInstance:
    def __init__(self, dcb=None, dcb_offset=None, structure_definition=None):
        self.dcb = dcb
        self.dcb_offset = dcb_offset
        self.structure_definition = structure_definition
        self.name = self.structure_definition.name
        self.type = self.name

    def _read_property(self, offset: int, property_definition: PropertyDefinition):
        conv_type = property_definition.conversion_type
        data_type = property_definition.data_type

        if conv_type == ConversionTypes.Attribute:
            if data_type in [DataTypes.StrongPointer, DataTypes.WeakPointer]:
                end_offset = offset + ctypes.sizeof(ClassReference)
                # cls_ref = ClassReference.from_buffer(bytearray(self.dcb.raw_data[offset:end_offset]))
                cls_ref = ClassReference.from_buffer(self.dcb.raw_data, offset)
                cls_ref._dcb = self.dcb
                cls_ref = None if cls_ref.reference is None else cls_ref
                return cls_ref, end_offset
            elif data_type == DataTypes.Class:
                end_offset = offset + property_definition.type_def.calculated_data_size
                return (
                    self.dcb.get_structure_instance_from_offset(
                        property_definition.structure_index, offset
                    ),
                    end_offset,
                )

            end_offset = offset + property_definition.calculated_data_size
            # buf = bytearray(self.dcb.raw_data[offset:end_offset])
            prop = property_definition.type_def.from_buffer(self.dcb.raw_data, offset)
            prop._dcb = self.dcb

            if data_type == DataTypes.EnumChoice:
                prop._enum_definition = self.dcb.enum_definitions[
                    property_definition.structure_index
                ]
            return prop.value, end_offset
        else:
            try:
                ConversionTypes(conv_type)  # will throw value error if this is not a valid type
                end_offset = offset + 8
                # buf = bytearray(
                #     self.dcb.raw_data[offset:end_offset]
                # )  # 8 == sizeof(int32 + int32)
                count, first_index = (ctypes.c_uint32 * 2).from_buffer(self.dcb.raw_data, offset)
                if data_type == DataTypes.Class:
                    clss = []
                    for _ in range(count):
                        cls_ref = ClassReference(
                            structure_index=property_definition.structure_index,
                            instance_index=first_index + _,
                        )
                        cls_ref._dcb = self.dcb
                        cls_ref = None if cls_ref.reference is None else cls_ref
                        clss.append(cls_ref)
                        # clss.append(
                        #     _clean_class_reference(
                        #         ClassReference(
                        #             structure_index=property_definition.structure_index,
                        #             instance_index=first_index + _
                        #         )
                        #     )
                        # )
                    return clss, end_offset
                elif data_type in self.dcb.values:
                    return (
                        self.dcb.values[property_definition.data_type][
                            first_index : first_index + count
                        ],
                        end_offset,
                    )
            except ValueError:
                pass
        raise NotImplementedError(f"Property has not been implemented: {property_definition}")

    @property
    def properties(self):
        props = AttrDict()
        offset = self.dcb_offset
        for prop_def in self.structure_definition.properties:
            props[prop_def.name], offset = self._read_property(offset, prop_def)
        return AttrDict(sorted(props.items(), key=lambda _: str.casefold(_[0])))

    def __repr__(self):
        return f"<StructInstance {self.name} props:{self.structure_definition.property_count}>"

    def __str__(self):
        return f"structInstance_{self.name}_props:{self.structure_definition.property_count}"


class StringReference(DataCoreBase):
    _fields_ = [("string_offset", ctypes.c_uint32)]

    @property
    def value(self):
        return self.dcb.string_for_offset(self.string_offset)

    def __repr__(self):
        return f"<StringRef offset:{self.string_offset}>"

    def __str__(self):
        return self.value


# Needed for EnumValueName, as it indexes into the new string table in Datacore V6
class StringReference2(DataCoreBase):
    _fields_ = [("string_offset", ctypes.c_uint32)]

    @property
    def value(self):
        return self.dcb.string_for_offset2(self.string_offset)

    def __repr__(self):
        return f"<StringRef offset:{self.string_offset}>"

    def __str__(self):
        return self.value


# Under Datacore V6 at least Locales are effectively just StringReferences, with both reading out of the first table.
class LocaleReference(StringReference):
    pass


class Pointer:
    @property
    def properties(self):
        if self.reference is not None:
            return self.reference.properties
        return {}

    @property
    def name(self):
        return self.reference.name if self.reference is not None else ""

    @property
    def type(self):
        return self.reference.name if self.reference is not None else ""

    @cached_property
    def reference(self):
        if self.structure_index == DCB_NO_PARENT or self.instance_index == DCB_NO_PARENT:
            return None
        # return self.dcb.structure_instances[self.structure_index][self.instance_index]
        return self.dcb.get_structure_instance(self.structure_index, self.instance_index)

    @property
    def structure_definition(self):
        if self.structure_index == DCB_NO_PARENT:
            return None
        return self.dcb.structure_definitions[self.structure_index]


class StrongPointer(Pointer, DataCoreBase):
    _fields_ = [
        ("structure_index", ctypes.c_uint32),
        ("instance_index", ctypes.c_uint32),
    ]

    def __repr__(self):
        if self.structure_definition is not None:
            return f"<StrongPointer structure:{self.structure_definition.name} instance:{self.instance_index}>"
        return f"<StrongPointer structure:{DCB_NO_PARENT} instance:{self.instance_index}>"

    def __str__(self):
        if self.structure_definition is not None:
            return f"strongPointer_structure:{self.structure_definition.name}"
        return f"strongPointer_structure:{DCB_NO_PARENT}"


class ClassReference(StrongPointer):
    def __repr__(self):
        if self.structure_definition is not None:
            return f"<ClassReference structure:{self.structure_definition.name} instance:{self.instance_index}>"
        return f"<ClassReference structure:{DCB_NO_PARENT} instance:{self.instance_index}>"

    def __str__(self):
        if self.structure_definition is not None:
            return f"classReference_structure:{self.structure_definition.name}"
        return f"classReference_structure:{DCB_NO_PARENT}"


class WeakPointer(Pointer, DataCoreBase):
    _fields_ = [
        ("structure_index", ctypes.c_uint32),
        ("instance_index", ctypes.c_uint32),
    ]

    def __repr__(self):
        try:
            if self.structure_definition is not None:
                return f"<WeakPointer structure:{self.structure_definition.name} instance:{self.instance_index}>"
        except IndexError:
            pass
        return f"<WeakPointer structure:{self.structure_index} instance:{self.instance_index}>"

    def __str__(self):
        try:
            if self.structure_definition is not None:
                return f"weakPointer:{self.structure_definition.name}"
        except IndexError:
            pass
        return f"weakPointer:{self.structure_index}"

    @property
    def properties(self):
        if self.reference is not None:
            return AttrDict(
                {
                    "name": self.reference.name,
                    "structure_index": self.structure_index,
                    "index": self.instance_index,
                }
            )
        return {}


class Record(Pointer, DataCoreNamed):
    _fields_ = [
        ("name_offset", ctypes.c_uint32),
        ("filename_offset", ctypes.c_uint32),
        ("structure_index", ctypes.c_uint32),
        ("id", GUID),
        ("instance_index", ctypes.c_uint16),
        ("other_index", ctypes.c_uint16),
    ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    # Pulls from the new string table in Datacore V6
    @property
    def name(self):
        return self.dcb.string_for_offset2(self.name_offset).replace(f"{self.type}.", "", 1)

    # Pulls from the old string table in Datacore V6
    @property
    def filename(self):
        return self.dcb.string_for_offset(self.filename_offset)

    def __repr__(self):
        struct_name = (
            self.structure_definition.name
            if self.structure_definition is not None
            else DCB_NO_PARENT
        )
        return (
            f"<Record name:{self.name} {self.id.value} struct:{struct_name} "
            f"instance:{self.instance_index}>"
        )

    def __str__(self):
        struct_name = (
            self.structure_definition.name
            if self.structure_definition is not None
            else DCB_NO_PARENT
        )
        return f"record:{self.name}:{self.id.value}_struct:{struct_name}"


class Reference(DataCoreBase):
    _fields_ = [("instance_index", ctypes.c_uint32), ("value", GUID)]

    @property
    def properties(self):
        if self.reference is not None:
            return self.reference.properties
        return {}

    @property
    def name(self):
        if self.reference is not None:
            return self.reference.name
        return ""

    @property
    def reference(self):
        return self.dcb.records_by_guid.get(self.value.value)

    def __repr__(self):
        return f"<Reference record:{self.value} instance:{self.instance_index}>"

    def __str__(self):
        return f"reference:{self.value.value}"


DATA_TYPE_LOOKUP = {
    DataTypes.Reference: Reference,
    DataTypes.WeakPointer: WeakPointer,
    DataTypes.StrongPointer: StrongPointer,
    # DataTypes.Class: ,
    DataTypes.EnumChoice: EnumChoice, # Can probably just use StringReference under Datacore v6
    DataTypes.EnumValueName: StringReference2, # Unfortunately this uses the new table in Datacore v6
    DataTypes.GUID: GUID,
    DataTypes.Locale: LocaleReference, # Can probably also just use StringReference under Datacore v6
    DataTypes.Double: ctypes.c_double,
    DataTypes.Float: ctypes.c_float,
    DataTypes.StringRef: StringReference,
    DataTypes.UInt64: ctypes.c_uint64,
    DataTypes.UInt32: ctypes.c_uint32,
    DataTypes.UInt16: ctypes.c_uint16,
    DataTypes.UInt8: ctypes.c_uint8,
    DataTypes.Int64: ctypes.c_int64,
    DataTypes.Int32: ctypes.c_int32,
    DataTypes.Int16: ctypes.c_int16,
    DataTypes.Int8: ctypes.c_int8,
    DataTypes.Boolean: ctypes.c_bool,
    DataTypes.ArrayPointer: ctypes.c_int32 * 2,
}
