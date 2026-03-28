import logging
from enum import IntEnum

from .. import defs
from ..base import Chunk, Chunk900

logger = logging.getLogger(__name__)


class MtlNameType(IntEnum):
    # It looks like there is a 0x04 type now as well, for mech parts.  Not sure what that is.
    # Also a 0x0B type now as well.
    Library = (0x01,)
    MwoChild = (0x02,)
    Single = (0x10,)
    Child = (0x12,)
    Unknown1 = (
        0x0B,
    )  # Collision materials?  In MWO, these are the torsos, arms, legs from body/<mech>.mtl
    Unknown2 = 0x04


class MtlNamePhysicsType(IntEnum):
    INVALID = (-2,)
    NONE = (-1,)
    DEFAULT = (0x00000000,)
    NOCOLLIDE = (0x00000001,)
    OBSTRUCT = (0x00000002,)
    DEFAULTPROXY = (
        0x000000FF,
    )  # this needs to be checked.  cgf.xml says 256; not sure if hex or dec
    UNKNOWN = (0x00001100,)  # collision mesh?
    UNKNOWN1 = 0x1000  # found in 'data/objects/spaceships/ships/aegs/javelin/interior/set_tec/tec_ceiling_fan.cgf'
    UNKNOWN2 = 0x1001  # found in javelin.cga
    UNKNOWN3 = (
        0x1002  # found in Data\Objects\planet\flora\tree\dendrosenecio\dendrosenecio_b_lod4.cgf
    )


class MtlName:
    name: str


@defs.chunk_handler(defs.ChunkType.MtlName, versions=[0x800])
class MtlName800(MtlName, Chunk):
    def __init__(self, header, data, chunk_file):
        super().__init__(header, data, chunk_file)

        self.flags = self.chunk_data.unpack("I")
        self.flags2 = self.chunk_data.unpack("i")
        self.name = self.chunk_data.unpack("128s").decode("utf-8").strip("\x00")
        self.physics_type = self.chunk_data.unpack("i")
        self.num_sub_materials = self.chunk_data.unpack("i")
        self.sub_material_ids = [self.chunk_data.unpack("i") for _ in range(self.num_sub_materials)]
        self.mat_type = MtlNameType.Single if self.num_sub_materials == 0 else MtlNameType.Library

    def __str__(self):
        phys_types = "\n    ".join(str(_) for _ in self.physics_types)
        return (
            f"Material: {self.name}\nType: {self.mat_type}\n"
            f"Children: {self.num_sub_materials}\nPhysics Types:\n{phys_types}"
        )

    def __repr__(self):
        return (
            f"<MtlName800 name:{self.name} type:{self.mat_type.name} id:{self.id} "
            f"num_sub_mats:{self.num_sub_materials}>"
        )


@defs.chunk_handler(defs.ChunkType.MtlName, versions=[0x802])
class MtlName802(MtlName, Chunk):
    def __init__(self, header, data, chunk_file):
        super().__init__(header, data, chunk_file)

        self.name = self.chunk_data.unpack("128s")[0].decode("utf-8").strip("\x00")
        self.num_sub_materials = self.chunk_data.unpack("i")
        self.mat_type = MtlNameType.Single if self.num_sub_materials == 0 else MtlNameType.Library
        self.sub_material_physics_types = []
        for _ in range(self.num_sub_materials):
            try:
                self.sub_material_physics_types.append(
                    MtlNamePhysicsType(self.chunk_data.unpack("i"))
                )
            except ValueError as e:
                logger.error(f"{e}")
                self.sub_material_physics_types.append(MtlNamePhysicsType.INVALID)

    def __str__(self):
        phys_types = "\n    ".join(str(_) for _ in self.sub_material_physics_types)
        return (
            f"Material: {self.name}\nType: {self.mat_type}\n"
            f"Children: {self.num_sub_materials}\nPhysics Types:\n{phys_types}"
        )

    def __repr__(self):
        return (
            f"<MtlName802 name:{self.name} type:{self.mat_type.name} id:{self.id} "
            f"num_sub_mats:{self.num_sub_materials}>"
        )


@defs.chunk_handler(defs.ChunkType.Character_MaterialName)
class MaterialName900(MtlName, Chunk900):
    size = 128

    def __init__(self, header, data, model):
        super().__init__(header, data, model)
        self.name = data.decode("utf-8").strip("\x00")

    def __repr__(self):
        return (
            f"<MaterialName900 name:{self.name} size:{self.size} offset:{self.chunk_header.offset}>"
        )
