import {
	LocationAmenity,
	LocationAmenityNames,
	LocationPropertySource,
	LocationPropertyType,
	LocationType,
	MAX_LOCATION_TREE_PROPERTIES,
	WorldSpace
} from "@versetools/types";
import { expect, test } from "vitest";

import { batchLocations, measureLocationSnapshot, type LocationSnapshot } from "../src/locations";

test("measures serialized batches and closure amplification", () => {
	const root = {
		cigGuid: "00000000-0000-4000-8000-000000000010",
		parentCigGuid: null,
		name: "Root",
		nameTranslationKey: "@root",
		description: null,
		descriptionTranslationKey: undefined,
		type: LocationType.System,
		sourceTypeName: "SolarSystem",
		typeCigGuid: "00000000-0000-4000-8000-000000000012",
		worldSpace: WorldSpace.Galactic,
		surface: false,
		position: { x: 0, y: 0, z: 0 },
		rotation: null,
		properties: [],
		objectContainerPropertiesComplete: true
	};
	const snapshot: LocationSnapshot = {
		locations: [
			root,
			{
				...root,
				cigGuid: "00000000-0000-4000-8000-000000000011",
				parentCigGuid: root.cigGuid,
				properties: [
					{
						type: LocationPropertyType.Amenity,
						value: LocationAmenity.ExternalFreightElevator,
						source: LocationPropertySource.ObjectContainer,
						sourceReference: "data/objectcontainers/pu/loc/mod/common/ext_cargo/elevator.socpak",
						name: LocationAmenityNames[LocationAmenity.ExternalFreightElevator]
					}
				],
				objectContainerPropertiesComplete: false
			}
		],
		invalidCigGuids: [],
		duplicateCount: 0,
		invalidParentCount: 0
	};
	const measurements = measureLocationSnapshot(snapshot);

	expect(measurements).toMatchObject({
		rootCount: 1,
		maximumDepth: 1,
		closureRows: 3,
		closureAmplification: 1.5,
		propertyCount: 1,
		locationTreePropertyLimit: MAX_LOCATION_TREE_PROPERTIES,
		locationTreePropertyHeadroom: MAX_LOCATION_TREE_PROPERTIES - 1,
		propertyTranslationKeyCount: 0,
		locationTranslationKeyCount: 2,
		incompleteObjectContainerPropertyCount: 1
	});
	expect(measurements.batchBytes).toEqual(
		batchLocations(snapshot).map(
			(batch) => new TextEncoder().encode(JSON.stringify(batch)).byteLength
		)
	);
	expect(measurements.totalBatchBytes).toBe(measurements.maximumBatchBytes);
});
