from .. import defs
from ..base import Chunk


@defs.chunk_handler(defs.ChunkType.AreaShape, versions=[0x001])
class AreaShapeObject(Chunk):
    def __init__(self, header, data, model):
        super().__init__(header, data, model)

        self.vis_areas = []
        self.portals = []

        self.chunk_data.read(4)  # unknown1
        self.area_shapes_len = self.chunk_data.unpack("<I")
        self.num_vis_areas = self.chunk_data.unpack("<I")
        self.num_portals = self.chunk_data.unpack("<I")
        self.chunk_data.read(4)  # unknown2

        # TODO: flesh out the rest of the areashape chunk
        #    dymek had parsed out some of the, what looks to be, old format, could be useful:
        #    https://github.com/dymek91/Exporting-Toolkit/blob/master/shipsExporter/CryEngine/ChCr/SCOC/AreaShapes.cs
