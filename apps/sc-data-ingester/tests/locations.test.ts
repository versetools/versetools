import {
	LocationAmenity,
	LocationAmenityNames,
	LocationPropertySource,
	LocationPropertyType,
	LocationType,
	WorldSpace
} from "@versetools/types";
import { describe, expect, test, vi } from "vitest";

import {
	batchLocations,
	canonicalizeSocpakPath,
	extractLocations,
	normalizeLocationType,
	snapshotHash,
	STAR_MAP_AMENITY_TYPES,
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

function addAmenityRecord(
	fixture: Fixture,
	id: string,
	name: string,
	{
		displayName = `@${name.toLowerCase().replaceAll(" ", "_")}`,
		icon = `UI/${name}.svg`
	}: { displayName?: unknown; icon?: unknown } = {}
): void {
	fixture.records.set(id, record(id, { name, displayName, icon }));
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

describe("amenity extraction", () => {
	const amenityMappings = [
		["Special Event", LocationAmenity.SpecialEvent],
		["Docking", LocationAmenity.Docking],
		["Garage", LocationAmenity.Garage],
		["Hospital", LocationAmenity.Hospital],
		["Clinic", LocationAmenity.Clinic],
		["Refinery", LocationAmenity.Refinery],
		["Buy Weapons", LocationAmenity.BuyWeapons],
		["Buy Ship Items and Weapons", LocationAmenity.BuyShipItemsAndWeapons],
		["Buy Armor", LocationAmenity.BuyArmor],
		["Buy Clothing", LocationAmenity.BuyClothing],
		["Buy Vehicles", LocationAmenity.BuyVehicles],
		["Rent Vehicles", LocationAmenity.RentVehicles],
		["Buy and Rent Vehicles", LocationAmenity.BuyAndRentVehicles],
		["Food Court", LocationAmenity.FoodCourt],
		["Hangar S", LocationAmenity.HangarS],
		["Hangar M", LocationAmenity.HangarM],
		["Hangar L", LocationAmenity.HangarL],
		["Hangar XL", LocationAmenity.HangarXl],
		["Landing Pad S", LocationAmenity.LandingPadS],
		["Landing Pad M", LocationAmenity.LandingPadM],
		["Landing Pad L", LocationAmenity.LandingPadL],
		["Landing Pad XL", LocationAmenity.LandingPadXl],
		["Vehicle Services", LocationAmenity.VehicleServices],
		["Commodity Trading - Freight Elevator", LocationAmenity.CargoFreightElevator],
		["Commodity Trading - Loading Dock", LocationAmenity.CargoLoadingDock]
	] as const;

	test("maps all 25 current raw amenity names explicitly", () => {
		expect(Object.entries(STAR_MAP_AMENITY_TYPES)).toEqual(amenityMappings);
	});

	test("extracts amenity provenance and falls back when display localization is unresolved", () => {
		const fixture = createFixture();
		const locationGuid = guid(10);
		const clinicGuid = guid(20);
		const dockingGuid = guid(21);
		addAmenityRecord(fixture, clinicGuid, "Clinic");
		addAmenityRecord(fixture, dockingGuid, "Docking", { displayName: "Docking Display" });
		addLocationRecord(fixture, {
			id: locationGuid,
			extra: { amenities: [clinicGuid, { guid: dockingGuid }] }
		});
		setRootChildren(fixture, [{ starMapRecord: locationGuid }]);

		const properties = extractLocations(fixture.dependencies).locations[1].properties;

		expect(properties).toEqual([
			{
				type: LocationPropertyType.Amenity,
				value: LocationAmenity.Clinic,
				source: LocationPropertySource.StarMapAmenity,
				sourceReference: clinicGuid,
				name: "Clinic",
				nameTranslationKey: "@clinic",
				icon: "UI/Clinic.svg"
			},
			expect.objectContaining({
				value: LocationAmenity.Docking,
				name: "Docking Display"
			})
		]);
	});

	test.each([
		["unresolved", guid(20), "Unable to resolve amenity"],
		["unknown", guid(21), "Unsupported amenity type 'Unknown'"],
		["missing icon", guid(22), "Missing icon for amenity"],
		["malformed reference", { nope: true }, "malformed amenity reference"]
	])("fails for %s amenities", (_description, amenity, message) => {
		const fixture = createFixture();
		const locationGuid = guid(10);
		if (amenity === guid(21)) addAmenityRecord(fixture, amenity, "Unknown");
		if (amenity === guid(22)) addAmenityRecord(fixture, amenity, "Clinic", { icon: null });
		addLocationRecord(fixture, { id: locationGuid, extra: { amenities: [amenity] } });
		setRootChildren(fixture, [{ starMapRecord: locationGuid }]);

		expect(() => extractLocations(fixture.dependencies)).toThrow(message);
	});

	test("fails for a malformed amenities collection", () => {
		const fixture = createFixture();
		const locationGuid = guid(10);
		addLocationRecord(fixture, { id: locationGuid, extra: { amenities: "Clinic" } });
		setRootChildren(fixture, [{ starMapRecord: locationGuid }]);

		expect(() => extractLocations(fixture.dependencies)).toThrow("has malformed amenities");
	});

	test("fails before batching when amenity provenance does not satisfy the shared contract", () => {
		const fixture = createFixture();
		const locationGuid = guid(10);
		const malformedAmenityGuid = "not-a-guid";
		addAmenityRecord(fixture, malformedAmenityGuid, "Clinic");
		addLocationRecord(fixture, {
			id: locationGuid,
			extra: { amenities: [malformedAmenityGuid] }
		});
		setRootChildren(fixture, [{ starMapRecord: locationGuid }]);

		expect(() => extractLocations(fixture.dependencies)).toThrow();
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

	test("retains the first duplicate placement when source paths are equal", () => {
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
		expect(snapshot.invalidCigGuids).toEqual([invalidGuid, descendantGuid].sort());
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
			nameTranslationKey: "@system_name",
			type: LocationType.System,
			worldSpace: WorldSpace.Galactic,
			position: { x: 10, y: 20, z: 30 },
			rotation: null
		});
		expect(planet).toMatchObject({
			cigGuid: planetGuid,
			parentCigGuid: SYSTEM_GUID,
			name: "ArcCorp",
			nameTranslationKey: undefined,
			description: "City planet",
			descriptionTranslationKey: undefined,
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

	test("retains resolved location translation keys", () => {
		const fixture = createFixture();
		const locationGuid = guid(10);
		addLocationRecord(fixture, {
			id: locationGuid,
			name: "@system_name",
			description: "@system_name"
		});
		setRootChildren(fixture, [{ starMapRecord: locationGuid }]);

		const location = extractLocations(fixture.dependencies).locations[1];

		expect(location).toMatchObject({
			name: "Stanton",
			nameTranslationKey: "@system_name",
			description: "Stanton",
			descriptionTranslationKey: "@system_name"
		});
	});

	test("traverses flagship, hospital, and hangar PU packages", () => {
		const fixture = createFixture();
		const paths = [
			"ObjectContainers/PU/loc/flagship/nyx/levski/levski_all.socpak",
			"Data/ObjectContainers/PU/loc/hospital/interior.socpak",
			"Data\\ObjectContainers\\PU\\loc\\hangar\\interior.socpak"
		];
		const ids = [guid(10), guid(11), guid(12)];
		ids.forEach((id) => addLocationRecord(fixture, { id }));
		setRootChildren(fixture, [{ name: paths[0] }]);
		fixture.socpaks.set(paths[0].toLowerCase(), {
			path: paths[0],
			children: [{ starMapRecord: ids[0], name: paths[1] }]
		});
		fixture.socpaks.set(paths[1].toLowerCase(), {
			path: paths[1],
			children: [{ starMapRecord: ids[1], name: paths[2] }]
		});
		fixture.socpaks.set(paths[2].toLowerCase(), {
			path: paths[2],
			children: [{ starMapRecord: ids[2] }]
		});

		const snapshot = extractLocations(fixture.dependencies);

		expect(snapshot.locations.map(({ cigGuid }) => cigGuid)).toEqual([SYSTEM_GUID, ...ids]);
		expect(new Set(snapshot.locations.map(({ cigGuid }) => cigGuid)).size).toBe(4);
	});

	test("retains the first package placement for duplicate locations", () => {
		const firstPath = "Data/ObjectContainers/PU/loc/zeta/location.socpak";
		const secondPath = "Data/ObjectContainers/PU/loc/alpha/location.socpak";
		const fixture = createFixture({ rootPaths: [firstPath, secondPath] });
		const locationGuid = guid(10);
		addLocationRecord(fixture, { id: locationGuid });
		fixture.socpaks.set(firstPath.toLowerCase(), {
			path: firstPath,
			children: [{ starMapRecord: locationGuid, pos: "9,9,9" }]
		});
		fixture.socpaks.set(secondPath.toLowerCase(), {
			path: secondPath,
			children: [{ starMapRecord: locationGuid, pos: "1,2,3" }]
		});

		expect(extractLocations(fixture.dependencies).locations[1].position).toEqual({
			x: 9,
			y: 9,
			z: 9
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

describe("object-container properties", () => {
	test("builds one enriched location from declared, repeated physical, and partial sources", () => {
		const fixture = createFixture();
		const locationGuid = guid(10);
		const clinicGuid = guid(20);
		const dockingGuid = guid(21);
		const externalPath =
			"Data/ObjectContainers/PU/loc/mod/common/ext_cargo/station_ext_cargo_003.socpak";
		const missingPath = "Data/ObjectContainers/PU/loc/mod/common/missing.socpak";
		addAmenityRecord(fixture, clinicGuid, "Clinic");
		addAmenityRecord(fixture, dockingGuid, "Docking");
		addLocationRecord(fixture, {
			id: locationGuid,
			extra: { amenities: [clinicGuid, dockingGuid, clinicGuid] }
		});
		setRootChildren(fixture, [
			{
				starMapRecord: locationGuid,
				children: [{ name: externalPath }, { name: externalPath }, { name: missingPath }]
			}
		]);
		fixture.socpaks.set(externalPath.toLowerCase(), { path: externalPath, children: [] });
		vi.mocked(fixture.dependencies.readSocpak).mockImplementation((path) => {
			if (path === missingPath) throw new Error(`SOCpak file '${path}' was not found in Data.p4k`);
			const result = fixture.socpaks.get(path.toLowerCase());
			if (!result) throw new Error(`Missing SOCpak ${path}`);
			return result;
		});

		const location = extractLocations(fixture.dependencies).locations[1];

		expect(location.objectContainerPropertiesComplete).toBe(false);
		expect(location.properties.map(({ value }) => value)).toEqual([
			LocationAmenity.Clinic,
			LocationAmenity.Docking,
			LocationAmenity.ExternalFreightElevator
		]);
	});

	test("canonicalizes optional Data prefixes and separators", () => {
		expect(canonicalizeSocpakPath("ObjectContainers\\PU\\LOC\\test.socpak")).toBe(
			"data/objectcontainers/pu/loc/test.socpak"
		);
		expect(canonicalizeSocpakPath("DATA/ObjectContainers/PU/loc/test.socpak")).toBe(
			"data/objectcontainers/pu/loc/test.socpak"
		);
	});

	test("classifies only external cargo module descendants and chooses a sorted reference", () => {
		const fixture = createFixture();
		const locationGuid = guid(10);
		const matching = [
			"ObjectContainers/PU/loc/mod/common/ext_cargo/z_variant.socpak",
			"Data/ObjectContainers/PU/loc/mod/common/ext_cargo/a_variant_42.socpak"
		];
		const unrelated = [
			"Data/ObjectContainers/PU/loc/mod/common/cargo/ext_cargo.socpak",
			"Data/ObjectContainers/PU/loc/mod/common/interior/elevator.socpak",
			"Data/ObjectContainers/PU/loc/mod/common/ext_cargo/not-a-package.xml"
		];
		addLocationRecord(fixture, { id: locationGuid });
		setRootChildren(fixture, [
			{
				starMapRecord: locationGuid,
				children: [...matching, ...unrelated].map((name) => ({ name }))
			}
		]);
		for (const path of [...matching, ...unrelated.filter((path) => path.endsWith(".socpak"))]) {
			fixture.socpaks.set(path.toLowerCase(), { path, children: [] });
		}

		const properties = extractLocations(fixture.dependencies).locations[1].properties;

		expect(properties).toEqual([
			{
				type: LocationPropertyType.Amenity,
				value: LocationAmenity.ExternalFreightElevator,
				source: LocationPropertySource.ObjectContainer,
				sourceReference: "data/objectcontainers/pu/loc/mod/common/ext_cargo/a_variant_42.socpak",
				name: LocationAmenityNames[LocationAmenity.ExternalFreightElevator]
			}
		]);
	});

	test("marks an owner incomplete for an identifiable ancillary miss and continues siblings", () => {
		const fixture = createFixture();
		const ownerGuid = guid(10);
		const siblingGuid = guid(11);
		const missingPath = "Data/ObjectContainers/PU/loc/missing.socpak";
		addLocationRecord(fixture, { id: ownerGuid });
		addLocationRecord(fixture, { id: siblingGuid });
		setRootChildren(fixture, [
			{
				starMapRecord: ownerGuid,
				children: [{ name: missingPath }, { starMapRecord: siblingGuid }]
			}
		]);
		vi.mocked(fixture.dependencies.readSocpak).mockImplementation((path) => {
			if (path === missingPath) throw new Error(`SOCpak file '${path}' was not found in Data.p4k`);
			const result = fixture.socpaks.get(path.toLowerCase());
			if (!result) throw new Error(`Missing SOCpak ${path}`);
			return result;
		});

		const snapshot = extractLocations(fixture.dependencies);

		expect(snapshot.locations.find(({ cigGuid }) => cigGuid === ownerGuid)).toMatchObject({
			objectContainerPropertiesComplete: false
		});
		expect(snapshot.locations.find(({ cigGuid }) => cigGuid === siblingGuid)).toBeDefined();
		expect(fixture.logger.info).toHaveBeenCalledWith(
			"Location ingestion anomalies",
			expect.objectContaining({ missingSocpakCount: 1 })
		);
	});

	test.each(["root", "location-bearing"])("keeps a missing %s package fatal", (kind) => {
		const missingPath = "Data/ObjectContainers/PU/loc/missing.socpak";
		const fixture = createFixture({ rootPaths: kind === "root" ? [missingPath] : [ROOT_PATH] });
		if (kind === "root") fixture.socpaks.delete(missingPath.toLowerCase());
		if (kind === "location-bearing")
			setRootChildren(fixture, [{ starMapRecord: guid(10), name: missingPath }]);
		vi.mocked(fixture.dependencies.readSocpak).mockImplementation((path) => {
			const result = fixture.socpaks.get(path.toLowerCase());
			if (result) return result;
			throw new Error(`SOCpak file '${path}' was not found in Data.p4k`);
		});

		expect(() => extractLocations(fixture.dependencies)).toThrow("was not found in Data.p4k");
	});

	test("keeps non-missing ancillary parse errors fatal", () => {
		const fixture = createFixture();
		const badPath = "Data/ObjectContainers/PU/loc/bad.socpak";
		setRootChildren(fixture, [{ name: badPath }]);
		vi.mocked(fixture.dependencies.readSocpak).mockImplementation((path) => {
			if (path === badPath) throw new Error("failed to parse SOCpak");
			return fixture.socpaks.get(path.toLowerCase());
		});

		expect(() => extractLocations(fixture.dependencies)).toThrow("failed to parse SOCpak");
	});

	test("produces stable hashes across traversal order and hashes properties and completeness", () => {
		function snapshot(reverse: boolean, incomplete = false) {
			const fixture = createFixture();
			const locationGuid = guid(10);
			const paths = [
				"Data/ObjectContainers/PU/loc/mod/common/ext_cargo/z.socpak",
				"Data/ObjectContainers/PU/loc/mod/common/ext_cargo/a.socpak"
			];
			addLocationRecord(fixture, { id: locationGuid });
			setRootChildren(fixture, [
				{
					starMapRecord: locationGuid,
					children: (reverse ? paths.toReversed() : paths).map((name) => ({ name }))
				}
			]);
			for (const path of paths) fixture.socpaks.set(path.toLowerCase(), { path, children: [] });
			const result = extractLocations(fixture.dependencies);
			if (incomplete) result.locations[1].objectContainerPropertiesComplete = false;
			return result;
		}

		const first = snapshot(false);
		const second = snapshot(true);
		expect(snapshotHash(first)).toBe(snapshotHash(second));
		expect(batchLocations(first)[0].batchHash).toBe(batchLocations(second)[0].batchHash);
		second.locations[1].properties = [];
		expect(snapshotHash(first)).not.toBe(snapshotHash(second));
		expect(batchLocations(first)[0].batchHash).not.toBe(batchLocations(second)[0].batchHash);
		const incomplete = snapshot(false, true);
		expect(snapshotHash(first)).not.toBe(snapshotHash(incomplete));
		expect(batchLocations(first)[0].batchHash).not.toBe(batchLocations(incomplete)[0].batchHash);
		const changedTranslationKey = snapshot(false);
		changedTranslationKey.locations[1].nameTranslationKey = "@changed_location_name";
		expect(snapshotHash(first)).not.toBe(snapshotHash(changedTranslationKey));
		expect(batchLocations(first)[0].batchHash).not.toBe(
			batchLocations(changedTranslationKey)[0].batchHash
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
		rotation: null,
		properties: [],
		objectContainerPropertiesComplete: true
	};
	const snapshot: LocationSnapshot = {
		locations: Array.from({ length: 26 }, (_, index) => ({
			...location,
			cigGuid: guid(index + 1)
		})),
		invalidCigGuids: [guid(101), guid(100)],
		duplicateCount: 0,
		invalidParentCount: 1
	};

	expect(
		batchLocations(snapshot).map((batch) => [batch.locations.length, batch.invalidCigGuids.length])
	).toEqual([
		[25, 0],
		[1, 0],
		[0, 2]
	]);
	expect(batchLocations(snapshot)[2].invalidCigGuids).toEqual([guid(100), guid(101)]);
	expect(snapshotHash(snapshot)).toBe(
		snapshotHash({ ...snapshot, invalidCigGuids: snapshot.invalidCigGuids.toReversed() })
	);
	expect(batchLocations(snapshot).every((batch) => /^[a-f0-9]{64}$/.test(batch.batchHash))).toBe(
		true
	);
});
