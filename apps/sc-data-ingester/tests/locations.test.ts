import { LocationType, WorldSpace } from "@versetools/types";
import { describe, expect, test, vi } from "vitest";

import {
	batchLocations,
	extractLocations,
	normalizeLocationType,
	type LocationExtractorDependencies,
	type LocationSnapshot
} from "../src/locations";

const UNIVERSE_GUID = "d4aff31c-4a4e-432b-adf2-464369a7fa7a";
const SYSTEM_COMPONENT_GUID = guid(1);
const SYSTEM_GUID = guid(2);
const SYSTEM_TYPE_GUID = guid(3);
const ROOT_PATH = "Data/ObjectContainers/PU/System/root.socpak";

type Fixture = {
	dependencies: LocationExtractorDependencies;
	logger: { info: ReturnType<typeof vi.fn> };
	records: Map<string, unknown>;
	socpaks: Map<string, unknown>;
};

function guid(value: number): string {
	return `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
}

function record(id: string, value: Record<string, unknown>): unknown {
	return { _RecordId_: id, _RecordValue_: value };
}

function createFixture({
	legacyWrapper = false,
	rootPaths = [ROOT_PATH]
}: { legacyWrapper?: boolean; rootPaths?: string[] } = {}): Fixture {
	const records = new Map<string, unknown>();
	const socpaks = new Map<string, unknown>();
	const logger = { info: vi.fn() };
	const megaMapSolarSystem = {
		Record: SYSTEM_COMPONENT_GUID,
		ObjectContainers: rootPaths
	};
	records.set(
		UNIVERSE_GUID,
		record(UNIVERSE_GUID, {
			SolarSystems: [
				legacyWrapper ? { SMegaMapSolarSystem: megaMapSolarSystem } : megaMapSolarSystem
			]
		})
	);
	records.set(
		SYSTEM_COMPONENT_GUID,
		record(SYSTEM_COMPONENT_GUID, {
			SolarSystemRecord: SYSTEM_GUID,
			galacticPosition: { x: 10, y: 20, z: 30 }
		})
	);
	records.set(SYSTEM_GUID, record(SYSTEM_GUID, { name: "System", type: SYSTEM_TYPE_GUID }));
	records.set(
		SYSTEM_TYPE_GUID,
		record(SYSTEM_TYPE_GUID, { name: "SolarSystem", onParentSurface: false })
	);
	for (const path of rootPaths) socpaks.set(path.toLowerCase(), { path, children: [] });

	const dependencies = {
		lookupLocalization: vi.fn((identifier: string) =>
			identifier === "@system_name" ? "Stanton" : null
		),
		readDatacoreRecordByGuid: vi.fn((id: string) => {
			const result = records.get(id);
			if (!result) throw new Error(`Missing record ${id}`);
			return result;
		}),
		readSocpak: vi.fn((path: string) => {
			const result = socpaks.get(path.toLowerCase());
			if (!result) throw new Error(`Missing SOCpak ${path}`);
			return result;
		}),
		logger
	} satisfies LocationExtractorDependencies;

	return { dependencies, logger, records, socpaks };
}

function addLocationRecord(
	fixture: Fixture,
	{
		id,
		typeName = "Planet",
		typeId = guid(Number(id.slice(-12)) + 1000),
		name = `Location ${id.slice(-4)}`,
		parent,
		description,
		surface = false,
		extra = {}
	}: {
		id: string;
		typeName?: string;
		typeId?: string;
		name?: string;
		parent?: string;
		description?: string;
		surface?: boolean;
		extra?: Record<string, unknown>;
	}
): void {
	fixture.records.set(typeId, record(typeId, { name: typeName, onParentSurface: surface }));
	fixture.records.set(
		id,
		record(id, {
			name,
			type: typeId,
			...(parent === undefined ? {} : { parent }),
			...(description === undefined ? {} : { description }),
			...extra
		})
	);
}

function setRootChildren(fixture: Fixture, children: Record<string, unknown>[]): void {
	fixture.socpaks.set(ROOT_PATH.toLowerCase(), { path: ROOT_PATH, children });
}

describe("location type normalization", () => {
	test.each([
		["SolarSystem", LocationType.System],
		["Star", LocationType.Star],
		["Planet", LocationType.Planet],
		["Moon", LocationType.Moon],
		["Asteroid", LocationType.Asteroid],
		["Asteroid_ValidQT", LocationType.Asteroid],
		["Anomaly", LocationType.Anomaly],
		["CardinalPoint", LocationType.CardinalPoint],
		["JumpPoint", LocationType.JumpPoint],
		["Outpost", LocationType.Outpost],
		["LandingZone", LocationType.LandingZone],
		["NavPoint", LocationType.NavPoint],
		["PointOfInterest", LocationType.PointOfInterest],
		["Manmade", LocationType.Manmade],
		["ManmadeJumpPoint", LocationType.JumpPoint],
		["Manmade_VisibleOnInteraction", LocationType.Manmade],
		["Outpost_InvalidQT", LocationType.Outpost],
		["QuantumTracePoint", LocationType.QuantumTracePoint],
		["S42_Moon", LocationType.Moon],
		["S42_Planet", LocationType.Planet],
		["YouAreHere", LocationType.YouAreHere]
	])("maps live source type %s", (sourceType, expected) => {
		expect(normalizeLocationType(sourceType)).toBe(expected);
	});

	test("fails extraction for an unknown source type", () => {
		const fixture = createFixture();
		const unknownGuid = guid(10);
		addLocationRecord(fixture, { id: unknownGuid, typeName: "Unknown" });
		setRootChildren(fixture, [{ starMapRecord: unknownGuid }]);

		expect(() => extractLocations(fixture.dependencies)).toThrow(
			"Unsupported location type 'Unknown'"
		);
	});
});

describe("location extraction traversal", () => {
	test("traverses structural containers under the nearest location", () => {
		const fixture = createFixture();
		const planetGuid = guid(10);
		addLocationRecord(fixture, {
			id: planetGuid,
			extra: { hideInWorld: true, hideInStarmap: true }
		});
		setRootChildren(fixture, [{ children: [{ starMapRecord: planetGuid }] }]);

		const snapshot = extractLocations(fixture.dependencies);

		expect(snapshot.locations.map(({ cigGuid }) => cigGuid)).toEqual([SYSTEM_GUID, planetGuid]);
		expect(snapshot.locations[1].parentCigGuid).toBe(SYSTEM_GUID);
	});

	test("continues below an unresolved starmap record", () => {
		const fixture = createFixture();
		const unresolvedGuid = guid(10);
		const childGuid = guid(11);
		addLocationRecord(fixture, { id: childGuid });
		setRootChildren(fixture, [
			{ starMapRecord: unresolvedGuid, children: [{ starMapRecord: childGuid }] }
		]);

		const snapshot = extractLocations(fixture.dependencies);

		expect(snapshot.invalidCigGuids).toContain(unresolvedGuid);
		expect(snapshot.locations.find(({ cigGuid }) => cigGuid === childGuid)?.parentCigGuid).toBe(
			SYSTEM_GUID
		);
		expect(fixture.logger.info).toHaveBeenCalledWith(
			"Location ingestion anomalies",
			expect.objectContaining({ unresolvedRecordCount: 1 })
		);
	});

	test("retains the first duplicate placement", () => {
		const fixture = createFixture();
		const planetGuid = guid(10);
		addLocationRecord(fixture, { id: planetGuid });
		setRootChildren(fixture, [
			{ starMapRecord: planetGuid, pos: "1,2,3" },
			{ starMapRecord: planetGuid, pos: "4,5,6" }
		]);

		const snapshot = extractLocations(fixture.dependencies);

		expect(snapshot.duplicateCount).toBe(1);
		expect(snapshot.locations.find(({ cigGuid }) => cigGuid === planetGuid)?.position).toEqual({
			x: 1,
			y: 2,
			z: 3
		});
		expect(fixture.logger.info).toHaveBeenCalledWith(
			"Location ingestion anomalies",
			expect.objectContaining({
				duplicateSamples: [expect.stringContaining('position={"x":4,"y":5,"z":6}')]
			})
		);
	});

	test("retains distinct GUIDs at the same transform", () => {
		const fixture = createFixture();
		const firstGuid = guid(10);
		const secondGuid = guid(11);
		addLocationRecord(fixture, { id: firstGuid });
		addLocationRecord(fixture, { id: secondGuid });
		setRootChildren(fixture, [
			{ starMapRecord: firstGuid, pos: "1,2,3" },
			{ starMapRecord: secondGuid, pos: "1,2,3" }
		]);

		const snapshot = extractLocations(fixture.dependencies);

		expect(snapshot.duplicateCount).toBe(0);
		expect(snapshot.locations.map(({ cigGuid }) => cigGuid)).toEqual([
			SYSTEM_GUID,
			firstGuid,
			secondGuid
		]);
	});

	test("propagates invalid parents to descendants and retains valid siblings", () => {
		const fixture = createFixture();
		const missingParentGuid = guid(99);
		const invalidGuid = guid(10);
		const descendantGuid = guid(11);
		const siblingGuid = guid(12);
		addLocationRecord(fixture, { id: invalidGuid, parent: missingParentGuid });
		addLocationRecord(fixture, { id: descendantGuid });
		addLocationRecord(fixture, { id: siblingGuid });
		setRootChildren(fixture, [
			{ starMapRecord: invalidGuid, children: [{ starMapRecord: descendantGuid }] },
			{ starMapRecord: siblingGuid }
		]);

		const snapshot = extractLocations(fixture.dependencies);

		expect(snapshot.locations.map(({ cigGuid }) => cigGuid)).toEqual([SYSTEM_GUID, siblingGuid]);
		expect(snapshot.invalidCigGuids).toEqual(expect.arrayContaining([invalidGuid, descendantGuid]));
		expect(snapshot.invalidParentCount).toBe(2);
	});

	test("orders every parent before its descendants", () => {
		const fixture = createFixture();
		const parentGuid = guid(30);
		const childGuid = guid(20);
		const grandchildGuid = guid(10);
		addLocationRecord(fixture, { id: parentGuid });
		addLocationRecord(fixture, { id: childGuid });
		addLocationRecord(fixture, { id: grandchildGuid });
		setRootChildren(fixture, [
			{
				starMapRecord: parentGuid,
				children: [{ starMapRecord: childGuid, children: [{ starMapRecord: grandchildGuid }] }]
			}
		]);

		const ids = extractLocations(fixture.dependencies).locations.map(({ cigGuid }) => cigGuid);

		expect(ids.indexOf(SYSTEM_GUID)).toBeLessThan(ids.indexOf(parentGuid));
		expect(ids.indexOf(parentGuid)).toBeLessThan(ids.indexOf(childGuid));
		expect(ids.indexOf(childGuid)).toBeLessThan(ids.indexOf(grandchildGuid));
	});

	test("converts a system, planet, and nested location", () => {
		const fixture = createFixture();
		const planetGuid = guid(10);
		const moonGuid = guid(11);
		const nestedPath = "Data/ObjectContainers/PU/System/nested.socpak";
		fixture.records.set(
			SYSTEM_GUID,
			record(SYSTEM_GUID, { name: "@system_name", type: SYSTEM_TYPE_GUID })
		);
		addLocationRecord(fixture, {
			id: planetGuid,
			name: " ArcCorp ",
			description: " City planet ",
			surface: true
		});
		addLocationRecord(fixture, { id: moonGuid, typeName: "Moon", name: "Lyria" });
		setRootChildren(fixture, [
			{
				starMapRecord: planetGuid,
				name: nestedPath,
				pos: { x: 1, y: 2, z: 3 },
				rot: "0.5,0.1,0.2,0.3"
			}
		]);
		fixture.socpaks.set(nestedPath.toLowerCase(), {
			path: nestedPath,
			children: [{ starMapRecord: moonGuid, pos: "4,5,6" }]
		});

		const [system, planet, moon] = extractLocations(fixture.dependencies).locations;

		expect(system).toMatchObject({
			cigGuid: SYSTEM_GUID,
			name: "Stanton",
			type: LocationType.System,
			worldSpace: WorldSpace.Galactic,
			position: { x: 10, y: 20, z: 30 },
			rotation: null
		});
		expect(planet).toMatchObject({
			cigGuid: planetGuid,
			parentCigGuid: SYSTEM_GUID,
			name: "ArcCorp",
			description: "City planet",
			type: LocationType.Planet,
			sourceTypeName: "Planet",
			worldSpace: WorldSpace.Solar,
			surface: true,
			position: { x: 1, y: 2, z: 3 },
			rotation: { w: 0.5, x: 0.1, y: 0.2, z: 0.3 }
		});
		expect(moon).toMatchObject({
			cigGuid: moonGuid,
			parentCigGuid: planetGuid,
			type: LocationType.Moon,
			position: { x: 4, y: 5, z: 6 }
		});
	});

	test("supports the legacy SMegaMapSolarSystem wrapper", () => {
		const fixture = createFixture({ legacyWrapper: true });

		expect(extractLocations(fixture.dependencies).locations[0].cigGuid).toBe(SYSTEM_GUID);
		expect(fixture.dependencies.readSocpak).toHaveBeenCalledWith(ROOT_PATH);
	});

	test("traverses every root SOCpak", () => {
		const secondRoot = "Data/ObjectContainers/PU/System/second.socpak";
		const fixture = createFixture({ rootPaths: [ROOT_PATH, secondRoot] });
		const firstGuid = guid(10);
		const secondGuid = guid(11);
		addLocationRecord(fixture, { id: firstGuid });
		addLocationRecord(fixture, { id: secondGuid });
		fixture.socpaks.set(ROOT_PATH.toLowerCase(), {
			path: ROOT_PATH,
			children: [{ starMapRecord: firstGuid }]
		});
		fixture.socpaks.set(secondRoot.toLowerCase(), {
			path: secondRoot,
			children: [{ starMapRecord: secondGuid }]
		});

		const snapshot = extractLocations(fixture.dependencies);

		expect(snapshot.locations.map(({ cigGuid }) => cigGuid)).toEqual([
			SYSTEM_GUID,
			firstGuid,
			secondGuid
		]);
		expect(fixture.dependencies.readSocpak).toHaveBeenCalledTimes(2);
	});

	test("fails on a recursive SOCpak cycle", () => {
		const fixture = createFixture();
		setRootChildren(fixture, [{ name: ROOT_PATH }]);

		expect(() => extractLocations(fixture.dependencies)).toThrow(
			`Recursive SOCpak reference includes ${ROOT_PATH}`
		);
	});
});

test("creates bounded, sequential location and invalid batches", () => {
	const location = {
		cigGuid: guid(1),
		parentCigGuid: null,
		name: "Test",
		description: null,
		type: LocationType.System,
		sourceTypeName: "SolarSystem",
		typeCigGuid: guid(2),
		worldSpace: WorldSpace.Galactic,
		surface: false,
		position: { x: 0, y: 0, z: 0 },
		rotation: null
	};
	const snapshot: LocationSnapshot = {
		locations: Array.from({ length: 26 }, (_, index) => ({
			...location,
			cigGuid: guid(index + 1)
		})),
		invalidCigGuids: [guid(100)],
		duplicateCount: 0,
		invalidParentCount: 1
	};

	expect(
		batchLocations(snapshot).map((batch) => [batch.locations.length, batch.invalidCigGuids.length])
	).toEqual([
		[25, 0],
		[1, 0],
		[0, 1]
	]);
	expect(batchLocations(snapshot).every((batch) => /^[a-f0-9]{64}$/.test(batch.batchHash))).toBe(
		true
	);
});
