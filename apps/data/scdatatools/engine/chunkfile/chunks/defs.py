import typing
from enum import IntEnum


class ChunkType(IntEnum):
    ###################################################################################################################
    # region: ChCr Chunks
    Any = (0x0,)
    Mesh = (0x1000,)
    Helper = (0x1001,)
    VertAnim = (0x1002,)
    BoneAnim = (0x1003,)
    GeomNameList = (0x1004,)
    BoneNameList = (0x1005,)
    MtlList = (0x1006,)
    MRM = (0x1007,)
    SceneProps = (0x1008,)
    Light = (0x1009,)
    PatchMesh = (0x100A,)
    Node = (0x100B,)
    Mtl = (0x100C,)
    Controller = (0x100D,)
    Timing = (0x100E,)
    BoneMesh = (0x100F,)
    BoneLightBinding = (0x1010,)
    MeshMorphTarget = (0x1011,)
    BoneInitialPos = (0x1012,)
    SourceInfo = (
        0x1013,
    )  # Describes the source from which the cgf was exported: source max file, machine and user.
    MtlName = (0x1014,)  # provides material name as used in the material.xml file
    ExportFlags = (0x1015,)  # Describes export information
    DataStream = (0x1016,)  # A data stream
    MeshSubsets = (0x1017,)  # Describes an array of mesh subsets
    MeshPhysicsData = (0x1018,)  # Physicalized mesh data

    # Star Citizen Types
    CompiledBonesSC = (0x2000,)
    CompiledPhysicalBonesSC = (0x2001,)
    CompiledMorphTargetsSC = (0x2002,)
    CompiledPhysicalProxiesSC = (0x2003,)
    CompiledIntFacesSC = (0x2004,)
    CompiledIntSkinVerticesSC = (0x2005,)
    CompiledExt2IntMapSC = (0x2006,)

    CryXMLB = (0x0004,)
    JSON = (0x0011,)

    UnknownSC1 = (
        0x3004,
    )  # 'data/objects/spaceships/ships/aegs/javelin/exteriors/aegs_javelin.cga'
    UnknownSC2 = (
        0x0002,
    )  # 'data/objectcontainers/ships/aegs/javelin/base_int_hab_main/base_int_hab_main.soc'

    # https://github.com/dymek91/Exporting-Toolkit/blob/master/shipsExporter/CryEngine/ChCr/SCOC/Chunk_AreaShape.cs
    AreaShape = (
        0x000E,
    )  # 'data/objectcontainers/ships/aegs/javelin/base_int_hab_main/base_int_hab_main.soc'

    # https://github.com/dymek91/Exporting-Toolkit/blob/master/shipsExporter/CryEngine/ChCr/SCOC/Chunk_Objects.cs
    IncludedObjects = (
        0x0010,
    )  # 'data/objectcontainers/ships/aegs/javelin/base_int_hab_main/base_int_hab_main.soc'
    UnknownSC5 = (
        0x0008,
    )  # 'data/objectcontainers/ships/aegs/javelin/base_int_hab_main/base_int_hab_main.soc'
    UnknownSC6 = (
        0x300A,
    )  # 'data/objects/spaceships/ships/aegs/javelin/exteriors/aegs_javelin.cga'
    UnknownSC7 = (
        0x4002,
    )  # 'data/objects/spaceships/ships/aegs/javelin/exteriors/aegs_javelin.cga'
    UnknownSC8 = (0x3005,)  # Data\Objects\planets\flora\bush\bayberry_01\bayberry_01.cgfm: 12293
    UnknownSC9 = (0x0013,)
    UnknownSC10 = (0x0014,)
    UnknownSC11 = (0x000B,)
    # 'Data/Objects/Spaceships/Ships/ANVL/Carrack/Interior/engineering/anvl_crk_eng_walkway_railing_addon_display.cgf'
    UnknownSC12 = (0x4007,)
    UnknownSC13 = (0x5000,)
    # endregion
    ###################################################################################################################

    ###################################################################################################################
    # region: IVO Chunk Types
    # StarCitizen version 0x900
    # From  IVO_Loader? .dba files
    DBA_Skeleton = 0x0000300D
    DBAData = 0x194FBC50
    DBA = 0xF7351608  # is checked against -0x8cae9f8 in code
    DBA_UNKNOWN1 = (
        0x322BA3C7  # found in Data\Animations\Characters\Human\female_v2\force_reactions.dba
    )

    # From  IVO_Loader2? handles AIM files, .caf?
    AIM_Skeleton = 0x1BBC4103
    AIM_BShapes = 0xF5C6EB5B

    # Types for .chr/.skin
    # From  IVO_Loader3 seems to handle .chr, .skin
    # Character_Physics = 0x90C687DC
    # Character_BShapesGPU = 0x57A3BEFD
    # Character_MaterialName = 0x8335674E
    # Character_BShapes = 0x875CCB28
    # Character_SkinInfo = 0x9293B9D8
    # Character_SkinMesh = 0xB875B2D9
    # Character_Skeleton = 0xC201973C  # CompiledBones
    Character_Physics = 0x90C6  # 87DC
    Character_BShapesGPU = 0x57A3  # BEFD
    Character_MaterialName = 0x8335  # 674E
    Character_BShapes = 0x875C  # CB28
    Character_SkinInfo = 0x9293  # B9D8
    Character_SkinInfo_320 = 0x9291
    Character_SkinMesh = 0xB875  # B2D9
    Character_Skeleton = 0xC201  # 973C  # CompiledBones
    # endregion
    ###################################################################################################################


CHUNK_CLASSES = {}
CHUNK_HEADER_CLASSES = {}
CHUNK_FILE_HEADER_CLASSES = {}


def chunk_handler(chunk_type: ChunkType, versions: typing.List[int] = None):
    if versions is None:
        versions = ['any']

    def do_register(chunk_class):
        for version in versions:
            # TODO: enable this after dev
            # if version in CHUNK_CLASSES.setdefault(chunk_type, {}):
            #     raise KeyError(f'Chunk class already registered for {chunk_type.name} (0x{chunk_type:04x}) '
            #                    f'version 0x{version:04x}')
            CHUNK_CLASSES.setdefault(chunk_type, {})[version] = chunk_class
        return chunk_class

    return do_register


def chunk_header_handler(version):
    def do_register(chunk_class):
        if version in CHUNK_HEADER_CLASSES:
            raise KeyError(f"ChunkHeader class already registered for version 0x{version:04x}")
        CHUNK_HEADER_CLASSES[version] = chunk_class
        return chunk_class

    return do_register


def chunk_file_header(signature, override=False):
    def do_register(header_class):
        if signature in CHUNK_FILE_HEADER_CLASSES and not override:
            raise KeyError(f"ChunkFileHeader class already registered for {signature}")
        CHUNK_FILE_HEADER_CLASSES[signature] = header_class
        return header_class

    return do_register
