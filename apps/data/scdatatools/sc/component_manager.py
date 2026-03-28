import logging
from typing import TYPE_CHECKING

from scdatatools.forge.dco import dco_from_guid
from scdatatools.forge.dco.entities import Entity

if TYPE_CHECKING:
    from scdatatools.sc import StarCitizen

logger = logging.getLogger(__name__)


FILTERED_COMPONENTS = [
    "_lowpoly",
    "_test_inf_ammo",
    "_test_inf_ammo_dummy",
    "_turret",
]


class AttachableComponentManager:
    def __init__(self, sc: "StarCitizen"):
        self.sc = sc
        self.attachable_components = {}

        self.by_type = {}
        self.by_sub_type = {}
        self.by_size = {}
        self.by_tag = {}
        self.by_geom = {}
        self._loaded = False

    def load_attachable_components(self):
        for record in self.sc.datacore.entities.values():
            try:
                entity: Entity = dco_from_guid(self.sc, record)
                if 'SAttachableComponentParams' not in entity.components:
                    continue
                name = entity.name.casefold()
                if any(name.endswith(_) for _ in FILTERED_COMPONENTS):
                    continue
                self.attachable_components[entity.name] = entity
                ac = entity.components['SAttachableComponentParams']
                self.by_size.setdefault(ac.size, set()).add(entity)
                self.by_type.setdefault(ac.attachable_type, set()).add(entity)
                if (entity.geom_hash is not None):
                    self.by_geom.setdefault(entity.geom_hash, set()).add(entity)
                for sub_type in ac.attachable_sub_types:
                    self.by_sub_type.setdefault(sub_type, set()).add(entity)
                for tag in ac.tags:
                    self.by_tag.setdefault(tag, set()).add(entity)
            except Exception as e:
                logger.exception(f'Failed to process attachable component {record.filename}', exc_info=e)
        self._loaded = True

    def filter(self, name=None, size=None, type=None, sub_types=None, tags=None):
        if not self._loaded:
            self.load_attachable_components()

        entities = set(self.attachable_components.values())
        if name is not None:
            entities = [_ for _ in entities if name in _]
        if size is not None:
            entities &= self.by_size.setdefault(size, set())
        if type is not None:
            entities &= self.by_type.setdefault(type, set())
        if sub_types is not None:
            for sub_type in sub_types:
                entities &= self.by_sub_type.setdefault(sub_type, set())
        if tags is not None:
            for tag in tags:
                entities &= self.by_tag.setdefault(tag, set())
        return entities
