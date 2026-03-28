import os
import time
from datetime import timedelta
from itertools import chain
from pathlib import Path

import humanize

from scdatatools.engine.materials.mtl import MaterialLibrary
from scdatatools.p4k import P4KInfo, P4KExtFile, P4KFile
from scdatatools.utils import search_for_data_dir_in_path, generate_free_key
from .chcr import *
from .chunks import *
from .chunks.defs import ChunkType
from .chunks.geometry.nodes import Node
from .ivo import *


logger = logging.getLogger(__name__)
GEOMETRY_EXTENSIONS = [
    ".cga",
    ".cgam",
    ".cgf",
    ".cgfm",
    ".skin",
    ".skinm",
    ".chr",
    ".cdf",
]


class ChunkFile:
    def __init__(self, chunk_file: typing.Union[str, Path, P4KInfo, P4KExtFile], *args, **kwargs):
        self.filename = ""
        self._p4kinfo = None
        self.raw_data = None

        if isinstance(chunk_file, P4KExtFile):
            chunk_file = chunk_file.p4kinfo
        if isinstance(chunk_file, P4KInfo):
            self._p4kinfo = chunk_file
            self.filename = chunk_file.filename
            self.raw_data = bytearray(self._p4kinfo.p4k.open(self._p4kinfo).read())
        elif isinstance(chunk_file, (str, Path)) and (chunk_file := Path(chunk_file)).is_file():
            self.filename = chunk_file.as_posix()
            with chunk_file.open("rb") as f:
                self.raw_data = bytearray(f.read())

        if self.raw_data is None:
            raise ValueError(f"Could not read ChunkFile data from {chunk_file}")

        self.header = chunk_file_header_for_signature(self.raw_data[:4]).from_buffer(
            self.raw_data, 0
        )
        self.chunks = {}

        self._chunk_header_class = header_class_for_version(self.header.version)
        chunk_headers = [
            self._chunk_header_class.from_buffer(
                self.raw_data,
                self.header.chunk_hdr_table_offset + (i * ctypes.sizeof(self._chunk_header_class)),
            )
            for i in range(self.header.num_chunks)
        ]

        for h in chunk_headers:
            try:
                t = time.time_ns()
                chunk = chunk_from_header(
                    h,
                    self.raw_data,
                    self,
                    fallback_class=self._chunk_header_class.default_chunk_class,
                )
                if (e := time.time_ns() - t) >= 2e7:
                    print(
                        f"{humanize.precisedelta(timedelta(microseconds=e / 1e+6), minimum_unit='microseconds')} - {chunk}"
                    )
                self.chunks[chunk.id] = chunk
            except Exception as e:
                logger.exception(
                    f"Error processing chunk {h.id} in {self.filename}:\n{repr(h)} ",
                    exc_info=e,
                )
                self.chunks[h.type.name] = self._chunk_header_class.default_chunk_class.from_buffer(
                    h, self.raw_data, self
                )


def _geometry_parts(filename):
    basename, ext = str(filename).rsplit(".", maxsplit=1)
    if "skin" in ext:
        return f"{basename}.skin", f"{basename}.skinm"
    return f"{basename}.{ext[:3]}", f"{basename}.{ext[:3]}m"


class GeometryChunkFile(ChunkFile):
    def _find_mtl(self, path):
        if path.startswith('Data/'): path = path.removeprefix('Data/')
        if isinstance(self._data, P4KFile):
            try:
                path = path.lower()
                if f := self._data.NameToInfoLower.get(
                        path if path.startswith("data") else f"data/{path}"
                ):
                    return f
                elif f := self._data.getinfo((Path(self.filename).parent / path)):
                    return f
                elif "female_v2" in self.filename and (
                        f := self._data.getinfo(
                            Path(self.filename.replace("female_v2", "male_v7")).parent / path
                        )
                ):
                    # see note below...
                    return f
            except KeyError:
                pass
        elif isinstance(self._data, Path):
            if (f := self._data / path).is_file():
                return f
            elif (f := self._data / Path(self.filename).parent / path).is_file():
                return f            
            elif (
                    "female_v2" in f.parts
                    and (f := Path(f.as_posix().replace("female_v2", "male_v7"))).is_file()
            ):                
                # TODO: this one is dumb and i hate it, does star engine do this, or how does it magically figure out
                #       the relative use of a mtl file. is there a global mtl database in game? are mtl names unique 0.o
                return f
            elif (f := self._data / Path(path).name).is_file():
                return f
            elif (f := self._data / Path(self.filename).parent / Path(path).name).is_file():
                return f
            elif (f := self._data / Path(self.filename).parent.parent / Path(path).name).is_file():
                return f
        #logger.warning(f"Failed to find mtl library {f}")
        return None

    def __init__(
            self,
            chunk_file: typing.Union[str, Path, P4KInfo, P4KExtFile],
            data_root: typing.Union[Path, P4KFile] = None,
            auto_load_mesh: bool = False,
            *args,
            **kwargs,
    ):
        if isinstance(chunk_file, P4KExtFile):
            chunk_file = chunk_file.p4kinfo
        if isinstance(chunk_file, P4KInfo):
            filename = Path(chunk_file.filename)
        elif isinstance(chunk_file, str):
            filename = Path(chunk_file)
        else:
            filename = Path(chunk_file)

        main_geom, mesh_file = _geometry_parts(filename)
        if isinstance(chunk_file, P4KInfo):
            chunk_file = chunk_file.p4k.getinfo(main_geom)
        else:
            chunk_file = main_geom

        super().__init__(chunk_file, data_root=data_root, *args, **kwargs)

        self.mesh_file = mesh_file
        self.mesh_component = None
        self.skeleton = {}
        self.joints = []

        self._data = data_root
        if self._data is None and self._p4kinfo is not None:
            self._data = self._p4kinfo.p4k
        if self._data is None and filename.is_file():
            # try and determine the data directory from the given path
            data_root = search_for_data_dir_in_path(filename)
            if data_root and data_root.is_dir():
                self._data = data_root

        mtl_names = []

        # build up node tree
        self.nodes = {}
        self._root_node_names = []
        for chunk in self.chunks.values():
            if isinstance(chunk, MtlName):
                mtl_names.append(chunk.name)
            elif isinstance(chunk, Node):
                if chunk.parent_id == -1:
                    self._root_node_names.append(chunk.name)
                else:
                    self.chunks[chunk.parent_id].children.append(chunk.name)
                if chunk.name in self.nodes:
                    # if a chunk has the same name, let the "later" chunk override it. That is the one that should be
                    # merged from the mesh component. Rename the old one
                    new_name = generate_free_key(chunk.name, self.nodes)
                    self.nodes[new_name] = self.nodes.pop(chunk.name)
                    if chunk.name in self._root_node_names:
                        self._root_node_names.remove(chunk.name)
                        self._root_node_names.append(new_name)
                self.nodes[chunk.name] = chunk

        if auto_load_mesh:
            self.load_mesh_file()  # must be done _after_ loading the primary chunks

        # create the mtl libraries
        self.material_libraries = []
        for mtl_name in mtl_names:
            try:
                if m := self._find_mtl(f'{mtl_name.replace(".mtl", "")}.mtl'):
                    self.material_libraries.append(MaterialLibrary(m))
            except Exception:
                logger.exception(f"Failed to load mtl library {mtl_name}")

    def load_mesh_file(self):
        if not self.mesh_file or self.mesh_component is not None:
            return  # already loaded, or no mesh file

        if isinstance(self._data, P4KFile):
            try:
                self.mesh_component = ChunkFile(self._data.getinfo(self.mesh_file))
            except KeyError:
                logger.error(
                    f'Could not load the mesh component for "{self.filename}": "{self.mesh_file}"'
                )
                self.mesh_component = None
        if self.mesh_component is None:
            if os.path.isfile(self.mesh_file):
                self.mesh_component = ChunkFile(self.mesh_file)
            elif isinstance(self._data, Path) and (mf := (self._data / self.mesh_file)).is_file():
                self.mesh_component = ChunkFile(mf)

        # load mesh_component chunks into unified chunk list
        if self.mesh_component is not None:
            for chunk in self.mesh_component.chunks.values():
                self.chunks[chunk.id] = chunk
                if isinstance(chunk, Node):
                    if chunk.name in self.nodes:
                        # merge the node children and assume the existing nodes parent
                        chunk.children.extend(self.nodes[chunk.name].children)
                        chunk.parent_id = self.nodes[chunk.name].parent_id
                    self.nodes[chunk.name] = chunk
                    if (
                            chunk.parent_id >= 0
                            and chunk.name not in (parent := self.chunks[chunk.parent_id]).children
                    ):
                        parent.children.append(chunk.name)
                    elif chunk.parent_id == -1 and chunk.name not in self._root_node_names:
                        self._root_node_names.append(chunk.name)

        # resolve node children now that we've merged the two geom files
        for node in self.nodes.values():
            node.children = [self.nodes[child] for child in node.children]

    @property
    def root_nodes(self):
        return [self.nodes[name] for name in self._root_node_names if name in self.nodes]

    @cached_property
    def lods(self):
        model_path = Path(self.filename)
        ext = model_path.suffix[:4]
        if "_lod" not in model_path.stem:
            lod_search = f"{model_path.stem}_lod[0-9]{ext}"
        else:
            lod_search = f"{model_path.stem[:-1]}[0-9]{ext}"

        lods = {}
        if self._p4kinfo is not None:
            lods = {
                lod.filename.split("_lod")[-1].split(".")[0]: lod
                for lod in self._p4kinfo.p4k.search((model_path.parent / lod_search).as_posix())
            }
        elif model_path.is_file():
            lods = {
                lod.stem.split("_lod")[-1].split(".")[0]: lod
                for lod in model_path.parent.glob(lod_search)
            }

        for lod_num, lod in lods.items():
            try:
                lods[lod_num] = GeometryChunkFile(lod)
            except Exception as e:
                logging.exception(f"Failed to lod for {self.filename}", exc_info=e)
        return lods

    @cached_property
    def materials(self):
        return list(chain.from_iterable(_.materials for _ in self.material_libraries))

    def __repr__(self):
        return f'<GeometryChunkFile "{self.filename}">'


def load_chunk_file(
        chunk_file: typing.Union[str, Path, P4KInfo, P4KExtFile], *args, **kwargs
) -> typing.Union[ChunkFile, GeometryChunkFile]:
    """Loads a ChunkFile. Returns `Geometry` chunk file if appropriate, otherwise a ChunkFile"""
    if isinstance(chunk_file, P4KExtFile):
        chunk_file = chunk_file.p4kinfo
    if isinstance(chunk_file, P4KInfo):
        filename = Path(chunk_file.filename)
    elif isinstance(chunk_file, str):
        filename = Path(chunk_file)
    else:
        filename = Path(chunk_file)

    ext = filename.suffix
    if ext in GEOMETRY_EXTENSIONS:
        try:
            return GeometryChunkFile(chunk_file, *args, **kwargs)
        except KeyError:
            # this happens if the main component of the geometry is missing
            pass
    return ChunkFile(chunk_file, *args, **kwargs)
