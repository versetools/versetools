# TODO: these are placeholders to avoid verbose logging outputs - need to be researched/implemented

from . import defs
from .base import Chunk


@defs.chunk_handler(defs.ChunkType.UnknownSC12, versions=[0x001])
class UnknownSC12001(Chunk):
    """
    e.g. 'Data/Objects/Spaceships/Ships/ORIG/400i/interior/CargoBay/cargobay_wall_component_small_GLASS.cgf'
    chunk struct ChunkHeader746 {
        type [<enum 'ChunkType'>] = <ChunkType.UnknownSC12: 16391>;
        version [c_ushort] = 1;
        id [c_ulong] = 100;
        size [c_ulong] = 424;
        offset [c_ulong] = 6220;
    };
    """

    pass


@defs.chunk_handler(defs.ChunkType.UnknownSC13, versions=[0x001])
class UnknownSC13001(Chunk):
    """
    e.g. 'Data\Objects\Spaceships\Thrusters\AEGS\AEGS_Gladius_Thrusters\AEGS_Gladius_Thruster_Main.cga'
    struct ChunkHeader746 {
        type [<enum 'ChunkType'>] = 20480;
        version [c_ushort] = 2;
        id [c_ulong] = 110;
        size [c_ulong] = 32792;
        offset [c_ulong] = 760380;
    };
    """

    pass


@defs.chunk_handler(defs.ChunkType.UnknownSC6, versions=[0x001])
class UnknownSC6001(Chunk):
    """
    e.g. 'Data/Objects/Spaceships/Ships/ORIG/400i/interior/CargoBay/cargobay_wall_component_small_GLASS.cgf'
    chunk struct ChunkHeader746 {
        type [<enum 'ChunkType'>] = <ChunkType.UnknownSC6: 12298>;
        version [c_ushort] = 1;
        id [c_ulong] = 91;
        size [c_ulong] = 24;
        offset [c_ulong] = 4952;
    };

    """

    pass


@defs.chunk_handler(defs.ChunkType.UnknownSC2, versions=[0x005])
class UnknownSC2005(Chunk):
    """
    e.g. 'Data/ObjectContainers/Ships/ORIG/400i/elevator/elevator.soc'
    struct ChunkHeader746 {
        type [<enum 'ChunkType'>] = <ChunkType.UnknownSC2: 2>;
        version [c_ushort] = 5;
        id [c_ulong] = 1;
        size [c_ulong] = 4;
        offset [c_ulong] = 64;
    };
    """

    pass


@defs.chunk_handler(defs.ChunkType.UnknownSC5, versions=[0x002])
class UnknownSC5002(Chunk):
    pass


@defs.chunk_handler(defs.ChunkType.UnknownSC7, versions=[0x002])
class UnknownSC7002(Chunk):
    """
    e.g. 'Data/Objects/buildingsets/human/hightech/prop/dressing/crockery/crockery_plate_1_stack_a.cgf'
    chunk struct ChunkHeader746 {
        type [<enum 'ChunkType'>] = <ChunkType.UnknownSC7: 16386>;
        version [c_ushort] = 2;
        id [c_ulong] = 71;
        size [c_ulong] = 422012;
        offset [c_ulong] = 2280;
    };
    """

    pass
