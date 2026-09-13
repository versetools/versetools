import { LocationType, WorldSpace } from "@versetools/types";
import { expect, test } from "vitest";

import { batchLocations, measureLocationSnapshot, type LocationSnapshot } from "../src/locations";

test("measures serialized batches and closure amplification", () => {
	const root = {
		cigGuid: "00000000-0000-4000-8000-000000000010",
		parentCigGuid: null,
		name: "Root",
		description: null,
		type: LocationType.System,
		sourceTypeName: "SolarSystem",
		typeCigGuid: "00000000-0000-4000-8000-000000000012",
		worldSpace: WorldSpace.Galactic,
		surface: false,
		position: { x: 0, y: 0, z: 0 },
		rotation: null
	};
	const snapshot: LocationSnapshot = {
		locations: [
			root,
			{
				...root,
				cigGuid: "00000000-0000-4000-8000-000000000011",
				parentCigGuid: root.cigGuid
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
		closureAmplification: 1.5
	});
	expect(measurements.batchBytes).toEqual(
		batchLocations(snapshot).map(
			(batch) => new TextEncoder().encode(JSON.stringify(batch)).byteLength
		)
	);
	expect(measurements.totalBatchBytes).toBe(measurements.maximumBatchBytes);
});
