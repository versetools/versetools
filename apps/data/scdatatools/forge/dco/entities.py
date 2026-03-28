import logging
from functools import cached_property

from scdatatools.engine.cryxml import dict_from_cryxml_file
from scdatatools.utils import generate_free_key
from .common import DataCoreRecordObject, register_record_handler, dco_from_datacore, register_strong_pointer_handler

logger = logging.getLogger(__name__)


@register_record_handler("EntityClassDefinition")
class Entity(DataCoreRecordObject):
    def __init__(self, datacore, guid):
        super().__init__(datacore, guid)

        self.components = {}
        for c in sorted(self.object.properties["Components"], key=lambda _: _.name):
            self.components[generate_free_key(c.name, self.components.keys())] = dco_from_datacore(datacore, c)
        self.tags = [
            dco_from_datacore(self._datacore, t) for t in self.object.properties["tags"] if t.name
        ]
        self.geom_hash = None

    @property
    def label(self):
        try:
            key_label = self.components['SAttachableComponentParams'].properties['AttachDef'].properties['Localization'].properties['Name'][1:]
            label = self._sc.localization.gettext(key_label)
            return label
        except:
            return None


@register_strong_pointer_handler('SEntityComponentDefaultLoadoutParams')
class SEntityDefaultLoadoutParams(DataCoreRecordObject):
    @cached_property
    def loadout(self):
        def proc_loadout(entries):
            lo = {}
            for entry in entries:
                try:
                    entity = entry.properties['entityClassName']
                    sublo = entry.properties.get('loadout', {})
                    if sublo:
                        sublo = proc_loadout(sublo.properties.get("entries", []))
                    if ac := self._sc.attachable_component_manager.attachable_components.get(entity):
                        entity = ac
                        try:
                            entity.set_loadout(sublo)
                        except (AttributeError, KeyError):
                            pass  # entity doesn't support setting a loadout
                    port_name = entry.properties["itemPortName"]
                    lo[port_name] = {'entity': entity, 'loadout': sublo}
                except Exception as e:
                    logger.exception(
                        f"processing component SEntityComponentDefaultLoadoutParams",
                        exc_info=e,
                    )
            return lo

        return proc_loadout(self.properties["loadout"].properties.get("entries", []))


class Vehicle(Entity):
    @property
    def category(self):
        return self.object.properties["Category"]

    @property
    def icon(self):
        return self.object.properties["Icon"]

    @property
    def invisible(self):
        return self.object.properties["Invisible"]

    @property
    def bbox_selection(self):
        return self.object.properties["BBoxSelection"]

    @property
    def lifetime_policy(self):
        return dco_from_datacore(self._datacore, self.object.properties["lifetimePolicy"])

    @property
    def object_containers(self):
        return self.components["VehicleComponentParams"].objectContainers

    @property
    def max_bounding_box_size(self):
        return self.components["VehicleComponentParams"].maxBoundingBoxSize.properties

    @cached_property
    def vehicle_definition(self):
        try:
            vd = self._sc.p4k.NameToInfoLower[
                'data/' + self.components["VehicleComponentParams"].vehicleDefinition.lower()
                ]
            with vd.open() as f:
                return dict_from_cryxml_file(f)
        except Exception as e:
            logger.exception(f'Failed to read vehicle definition for {self.object.filename}', exc_info=e)
        return {}

    @cached_property
    def hardpoints(self):
        hps = {}

        def _walk_parts(d):
            if isinstance(d, list):
                for part in d:
                    _walk_parts(part)
                return

            if 'hardpoint' in (name := d.get('@name', '')) and d.get('@class', '') == 'ItemPort':
                hps[name] = d
            if 'Part' in d or 'Parts' in d:
                return _walk_parts(d['Part'] if 'Part' in d else d['Parts'])

        _walk_parts(self.vehicle_definition.get('Vehicle', {}).get('Parts', []))
        return hps

    @cached_property
    def editable_hardpoints(self):
        return {k: v for k, v in self.hardpoints.items() if 'uneditable' not in v.get('ItemPort', {}).get('@flags', '')}

    @cached_property
    def default_loadout(self):
        return {
            k: v for k, v in self.components['SEntityComponentDefaultLoadoutParams'].loadout.items()
            if k in self.editable_hardpoints
        }


@register_record_handler(
    "EntityClassDefinition",
    filename_match="libs/foundry/records/entities/spaceships/.*",
)
class Ship(Vehicle):
    def __repr__(self):
        return f"<DCO Ship {self.name}>"


@register_record_handler(
    "EntityClassDefinition",
    filename_match="libs/foundry/records/entities/groundvehicles/.*",
)
class GroundVehicle(Vehicle):
    def __repr__(self):
        return f"<DCO GroundVehicle {self.name}>"

@register_record_handler(
    "EntityClassDefinition",
    filename_match="libs/foundry/records/entities/scitem/.*",
)
class Carryable(Entity):
    def __init__(self, datacore, guid):
        super().__init__(datacore, guid)
        try:
            geom = self.components['SGeometryResourceParams'].object.properties['Geometry'].properties['Geometry']
            self.geometry_path = geom.properties['Geometry'].properties['path']
            self.geom_hash = hash(self.geometry_path)
        except:
            self.geometry_path = None
        
    def __repr__(self):
        return f"<DCO Carryable {self.name} '{self.label}'>"

@register_record_handler(
    "EntityClassDefinition",
    filename_match="libs/foundry/records/entities/scitem/characters/.*",
)
class Crateable(Carryable):
    def __init__(self, datacore, guid):
        super().__init__(datacore, guid)
        try:
            subs = self.components['SGeometryResourceParams'].object.properties['Geometry'].properties['SubGeometry']
            self.sub_geometry_path = [x.properties['Geometry'].properties['Geometry'].properties.path for x in subs]
            self.geom_hash = hash(''.join(self.sub_geometry_path))
        except:
            self.sub_geometry_path = []
        
    def __repr__(self):
        return f"<DCO Crateable {self.name} '{self.label}'>"

@register_record_handler(
    "EntityClassDefinition",
    filename_match="libs/foundry/records/entities/scitem/ships/weapon_mounts/gimbal/.*",
)
class GimbalMount(Entity):
    def __repr__(self):
        return f"<GimbalMount {self.name}>"

@register_record_handler(
    "EntityClassDefinition",
    filename_match="libs/foundry/records/transitsystem/transitcarriage/.*",
)
class TransitCarriage(Entity):
    def __repr__(self):
        return f"<TransitCarriage {self.name}>"
