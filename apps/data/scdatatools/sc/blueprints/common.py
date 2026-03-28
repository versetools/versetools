import logging
from pathlib import Path

from scdatatools.p4k import compressor_names


RECORDS_BASE_PATH = Path("libs/foundry/records/")
SHIP_ENTITIES_PATH = RECORDS_BASE_PATH / "entities/spaceships"
RECORD_KEYS_WITH_PATHS = [
    # all keys are lowercase to ignore case while matching
    "@file",  # @File mtl
    "@path",  # @Path/@path chrparams, entxml, soc_cryxml, mtl
    "@texture",  # soc_cryxml
    "@cubemaptexture",  # @cubemapTexture soc_cryxml
    "@externallayerfilepath",  # @externalLayerFilePath soc_cryxml
    "animationdatabase",  # AnimationDatabase Ship Entity record in 'SAnimationControllerParams'
    "animationcontroller",  # AnimationController Ship Entity record in 'SAnimationControllerParams'
    "voxeldatafile",  # voxelDataFile Ship Entity record in 'SVehiclePhysicsGridParams'
    "@subtagdef",  # in animation database tag files
    "@filename",  # in animation database tag files
]
RECORD_KEYS_WITH_AUDIO = ["audioTrigger"]
DEFAULT_ROTATION = ((1.0, 0.0, 0.0), (0.0, 1.0, 0.0), (0.0, 0.0, 1.0))
SOC_ENTITY_CLASSES_TO_SKIP = [
    # TODO: all TBDs in here are entityclasses in soc cryxmlbs that havent been researched yet
    # "AreaBox",  # TODO: TBD
    # "AreaShape",  # TODO: TBD
    "AudioAreaAmbience",  # TODO: TBD
    "AudioEnvironmentFeedbackPoint",  # TODO: TBD
    "AudioTriggerSpot",  # TODO: TBD
    "CameraSource",  # TODO: TBD
    "EditorCamera",  # TODO: TBD
    "FogVolume",  # TODO: TBD
    "GravityBox",  # TODO: TBD
    "Hazard",  # TODO: TBD
    "LandingArea",  # TODO: TBD
    "LedgeObject",  # TODO: TBD
    "NavigationArea",  # TODO: TBD
    "ParticleField",  # TODO: TBD
    "ParticleEffect",  # TODO: TBD
    "Room",  # Audio # TODO: TBD
    "RoomConnector",  # TODO: TBD
    "RotationSimple",  # TODO: TBD
    "SequenceObjectItem",  # TODO: TBD
    "SurfaceRaindropsTarget",  # TODO: TBD
    "TagPoint",  # TODO: TBD
    "TransitDestination",  # TODO: TBD
    "TransitGateway",  # TODO: TBD
    "TransitManager",  # TODO: TBD
    "TransitNavSpline",  # TODO: TBD
    "VibrationAudioPoint",  # TODO: TBD
    "VehicleAudioPoint",  # TODO: TBD
]
