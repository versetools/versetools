import { createHash } from "node:crypto";

import {
	lookupLocalization,
	readDatacoreRecordByGuid,
	readSocpak
} from "@versetools/sc-data-extractor";
import {
	IngestLocationSchema,
	LocationType,
	QuatSchema,
	Vec3Schema,
	WorldSpace
} from "@versetools/types";
import type * as z from "zod/v4";

export const UNIVERSE_GUID = "d4aff31c-4a4e-432b-adf2-464369a7fa7a";
const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";
// A location can produce one closure row for every ancestor, so this stays well below
// Convex's 16,000-write and 1,000-concurrent-I/O limits as the tree grows.
export const LOCATION_BATCH_SIZE = 25;
const ANOMALY_SAMPLE_LIMIT = 10;

type Vec3 = z.infer<typeof Vec3Schema>;
type Quat = z.infer<typeof QuatSchema>;
export type IngestLocation = z.infer<typeof IngestLocationSchema>;

type DataCoreRecord = {
	_RecordValue_?: Record<string, unknown>;
	_RecordId_?: string;
	__id?: string;
};

type ObjectContainer = {
	path?: string;
	children?: ObjectContainerChild[];
};

type ObjectContainerChild = Record<string, unknown> & {
	children?: ObjectContainerChild[];
};

export type LocationSnapshot = {
	locations: IngestLocation[];
	invalidCigGuids: string[];
	duplicateCount: number;
	invalidParentCount: number;
};

export type LocationSnapshotMeasurements = {
	batchBytes: number[];
	totalBatchBytes: number;
	maximumBatchBytes: number;
	rootCount: number;
	maximumDepth: number;
	closureRows: number;
	closureAmplification: number;
};

export type LocationExtractorDependencies = {
	lookupLocalization: typeof lookupLocalization;
	readDatacoreRecordByGuid: typeof readDatacoreRecordByGuid;
	readSocpak: typeof readSocpak;
	logger: Pick<Console, "info">;
};

const defaultDependencies: LocationExtractorDependencies = {
	lookupLocalization,
	readDatacoreRecordByGuid,
	readSocpak,
	logger: console
};

export function normalizeLocationType(sourceTypeName: string): LocationType {
	const types: Record<string, LocationType> = {
		SolarSystem: LocationType.System,
		Star: LocationType.Star,
		Planet: LocationType.Planet,
		Moon: LocationType.Moon,
		Asteroid: LocationType.Asteroid,
		Asteroid_ValidQT: LocationType.Asteroid,
		Anomaly: LocationType.Anomaly,
		CardinalPoint: LocationType.CardinalPoint,
		JumpPoint: LocationType.JumpPoint,
		Outpost: LocationType.Outpost,
		LandingZone: LocationType.LandingZone,
		NavPoint: LocationType.NavPoint,
		PointOfInterest: LocationType.PointOfInterest,
		Manmade: LocationType.Manmade,
		ManmadeJumpPoint: LocationType.JumpPoint,
		Manmade_VisibleOnInteraction: LocationType.Manmade,
		Outpost_InvalidQT: LocationType.Outpost,
		QuantumTracePoint: LocationType.QuantumTracePoint,
		S42_Moon: LocationType.Moon,
		S42_Planet: LocationType.Planet,
		YouAreHere: LocationType.YouAreHere
	};
	const type = types[sourceTypeName];
	if (!type) throw new Error(`Unsupported location type '${sourceTypeName}'`);
	return type;
}

function recordValue(record: unknown): Record<string, unknown> {
	if (!record || typeof record !== "object") throw new Error("DataCore record is invalid");
	const value = (record as DataCoreRecord)._RecordValue_;
	if (!value) throw new Error("DataCore record has no _RecordValue_");
	return value;
}

function guid(value: unknown): string | null {
	if (typeof value === "string") return value.toLowerCase() === EMPTY_GUID ? null : value;
	if (
		value &&
		typeof value === "object" &&
		(typeof (value as { guid?: unknown }).guid === "string" ||
			typeof (value as { _RecordId_?: unknown })._RecordId_ === "string")
	) {
		const result = ((value as { guid?: string }).guid ??
			(value as { _RecordId_: string })._RecordId_) as string;
		return result.toLowerCase() === EMPTY_GUID ? null : result;
	}
	return null;
}

function text(value: unknown, localize: typeof lookupLocalization): string | null {
	if (typeof value !== "string") return null;
	return value.startsWith("@") ? (localize(value) ?? value) : value;
}

function vector(value: unknown): Vec3 {
	if (value && typeof value === "object") {
		const vector = value as Partial<Vec3>;
		if (
			typeof vector.x === "number" &&
			typeof vector.y === "number" &&
			typeof vector.z === "number"
		) {
			return { x: vector.x, y: vector.y, z: vector.z };
		}
	}
	if (typeof value === "string") {
		const values = value.split(",").map(Number);
		if (values.length === 3 && values.every(Number.isFinite)) {
			return { x: values[0], y: values[1], z: values[2] };
		}
	}
	return { x: 0, y: 0, z: 0 };
}

function quaternion(value: unknown): Quat {
	if (value && typeof value === "object") {
		const rotation = value as Partial<Quat>;
		if (
			typeof rotation.w === "number" &&
			typeof rotation.x === "number" &&
			typeof rotation.y === "number" &&
			typeof rotation.z === "number"
		) {
			return { w: rotation.w, x: rotation.x, y: rotation.y, z: rotation.z };
		}
	}
	if (typeof value === "string") {
		const values = value.split(",").map(Number);
		if (values.length === 4 && values.every(Number.isFinite)) {
			return { w: values[0], x: values[1], y: values[2], z: values[3] };
		}
	}
	return { w: 1, x: 0, y: 0, z: 0 };
}

function locationFromStarMapObject(
	record: unknown,
	parentCigGuid: string | null,
	position: Vec3,
	rotation: Quat,
	dependencies: LocationExtractorDependencies
): IngestLocation {
	const source = recordValue(record);
	const cigGuid =
		guid((record as DataCoreRecord)._RecordId_) ??
		guid((record as DataCoreRecord).__id) ??
		guid(source.__id);
	const typeCigGuid = guid(source.type);
	if (!cigGuid || !typeCigGuid) throw new Error("StarMapObject is missing a CIG GUID or type GUID");
	const typeSource = recordValue(dependencies.readDatacoreRecordByGuid(typeCigGuid));
	const sourceTypeName = text(typeSource.name ?? typeSource.Name, dependencies.lookupLocalization);
	const name = text(source.name ?? source.Name, dependencies.lookupLocalization);
	if (!sourceTypeName || !name)
		throw new Error(`StarMapObject ${cigGuid} is missing a name or type name`);

	const sourceParent = guid(source.parent ?? source.Parent);
	return {
		cigGuid,
		parentCigGuid: sourceParent ?? parentCigGuid,
		name: name.trim(),
		description:
			text(source.description ?? source.Description, dependencies.lookupLocalization)?.trim() ??
			null,
		type: normalizeLocationType(sourceTypeName),
		sourceTypeName,
		typeCigGuid,
		worldSpace: WorldSpace.Solar,
		surface: typeSource.onParentSurface === true,
		position,
		rotation
	};
}

function systemLocation(
	megaMapSolarSystem: Record<string, unknown>,
	dependencies: LocationExtractorDependencies
): IngestLocation {
	const systemRecord = dependencies.readDatacoreRecordByGuid(
		requireGuid(megaMapSolarSystem.Record, "solar system record")
	);
	const system = recordValue(systemRecord);
	const starmap = dependencies.readDatacoreRecordByGuid(
		requireGuid(system.SolarSystemRecord, "solar system starmap record")
	);
	const location = locationFromStarMapObject(
		starmap,
		null,
		vector(system.galacticPosition),
		{
			w: 1,
			x: 0,
			y: 0,
			z: 0
		},
		dependencies
	);
	return { ...location, worldSpace: WorldSpace.Galactic, rotation: null };
}

function requireGuid(value: unknown, description: string): string {
	const result = guid(value);
	if (!result) throw new Error(`Missing ${description} GUID`);
	return result;
}

function containerPath(child: ObjectContainerChild): string | null {
	return typeof child.name === "string"
		? child.name
		: typeof child.path === "string"
			? child.path
			: null;
}

function shouldLoadSocpak(path: string): boolean {
	const normalized = path.replaceAll("\\", "/").toLowerCase();
	return (
		normalized.startsWith("data/objectcontainers/pu/") &&
		(normalized.includes("/system") ||
			normalized.includes("/station") ||
			normalized.includes("/jumppoint"))
	);
}

function sample(anomalies: string[], anomaly: string) {
	if (anomalies.length < ANOMALY_SAMPLE_LIMIT) anomalies.push(anomaly);
}

export function batchLocations(snapshot: LocationSnapshot): {
	locations: IngestLocation[];
	invalidCigGuids: string[];
	batchHash: string;
}[] {
	const batches = [];
	for (let index = 0; index < snapshot.locations.length; index += LOCATION_BATCH_SIZE) {
		const batch = {
			locations: snapshot.locations.slice(index, index + LOCATION_BATCH_SIZE),
			invalidCigGuids: []
		};
		batches.push({ ...batch, batchHash: hash(batch) });
	}
	for (let index = 0; index < snapshot.invalidCigGuids.length; index += LOCATION_BATCH_SIZE) {
		const batch = {
			locations: [],
			invalidCigGuids: snapshot.invalidCigGuids.slice(index, index + LOCATION_BATCH_SIZE)
		};
		batches.push({ ...batch, batchHash: hash(batch) });
	}
	return batches;
}

export function measureLocationSnapshot(snapshot: LocationSnapshot): LocationSnapshotMeasurements {
	const locations = new Map(snapshot.locations.map((location) => [location.cigGuid, location]));
	const depths = snapshot.locations.map((location) => depth(location, locations));
	const batchBytes = batchLocations(snapshot).map(
		(batch) => new TextEncoder().encode(JSON.stringify(batch)).byteLength
	);
	const closureRows = depths.reduce((total, locationDepth) => total + locationDepth + 1, 0);

	return {
		batchBytes,
		totalBatchBytes: batchBytes.reduce((total, bytes) => total + bytes, 0),
		maximumBatchBytes: Math.max(0, ...batchBytes),
		rootCount: snapshot.locations.filter((location) => location.parentCigGuid === null).length,
		maximumDepth: Math.max(0, ...depths),
		closureRows,
		closureAmplification: snapshot.locations.length ? closureRows / snapshot.locations.length : 0
	};
}

export function snapshotHash(snapshot: LocationSnapshot): string {
	return hash({ locations: snapshot.locations, invalidCigGuids: snapshot.invalidCigGuids });
}

function hash(value: unknown): string {
	return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function extractLocations(
	dependencies: LocationExtractorDependencies = defaultDependencies
): LocationSnapshot {
	const candidates = new Map<string, IngestLocation>();
	const activeSocpaks = new Set<string>();
	const invalid = new Set<string>();
	const duplicateSamples: string[] = [];
	const invalidParentSamples: string[] = [];
	const unresolvedRecordSamples: string[] = [];
	let duplicateCount = 0;
	let invalidParentCount = 0;
	let unresolvedRecordCount = 0;

	function addCandidate(candidate: IngestLocation, sourcePath: string) {
		if (candidates.has(candidate.cigGuid)) {
			duplicateCount++;
			sample(
				duplicateSamples,
				`${candidate.cigGuid} at ${sourcePath} position=${JSON.stringify(candidate.position)} rotation=${JSON.stringify(candidate.rotation)}`
			);
			return;
		}
		candidates.set(candidate.cigGuid, candidate);
	}

	function visit(container: ObjectContainer, parentCigGuid: string | null) {
		for (const child of container.children ?? []) {
			const starMapRecord = guid(child.starMapRecord);
			let candidate = null;
			if (starMapRecord) {
				let record;
				try {
					record = dependencies.readDatacoreRecordByGuid(starMapRecord);
				} catch (error) {
					unresolvedRecordCount++;
					sample(
						unresolvedRecordSamples,
						`${starMapRecord} from ${container.path ?? "unknown container"} child ${containerPath(child) ?? String(child.guid ?? "unknown")}: ${String(error)}`
					);
					invalid.add(starMapRecord);
				}
				if (record)
					candidate = locationFromStarMapObject(
						record,
						parentCigGuid,
						vector(child.pos),
						quaternion(child.rot),
						dependencies
					);
			}
			if (candidate) addCandidate(candidate, container.path ?? "unknown container");
			const childParentCigGuid = candidate?.cigGuid ?? parentCigGuid;
			visit({ path: container.path, children: child.children }, childParentCigGuid);

			const path = containerPath(child);
			if (path && shouldLoadSocpak(path)) visitSocpak(path, childParentCigGuid);
		}
	}

	function visitSocpak(path: string, parentCigGuid: string | null) {
		const key = path.toLowerCase();
		if (activeSocpaks.has(key)) throw new Error(`Recursive SOCpak reference includes ${path}`);
		activeSocpaks.add(key);
		try {
			visit(dependencies.readSocpak(path) as ObjectContainer, parentCigGuid);
		} finally {
			activeSocpaks.delete(key);
		}
	}

	const universe = recordValue(dependencies.readDatacoreRecordByGuid(UNIVERSE_GUID));
	const solarSystems = universe.SolarSystems;
	if (!Array.isArray(solarSystems)) throw new Error("Universe record has no SolarSystems");
	for (const entry of solarSystems) {
		if (!entry || typeof entry !== "object")
			throw new Error("Universe SolarSystems entry is invalid");
		const source = entry as Record<string, unknown>;
		const megaMapSolarSystem =
			source.SMegaMapSolarSystem && typeof source.SMegaMapSolarSystem === "object"
				? (source.SMegaMapSolarSystem as Record<string, unknown>)
				: source;
		const system = systemLocation(megaMapSolarSystem, dependencies);
		addCandidate(system, "MegaMap universe");
		const paths = megaMapSolarSystem.ObjectContainers;
		if (!Array.isArray(paths) || !paths.length || paths.some((path) => typeof path !== "string")) {
			throw new Error(`Solar system ${system.cigGuid} has no root object container`);
		}
		for (const rootPath of paths as string[]) visitSocpak(rootPath, system.cigGuid);
	}

	const valid = new Map(candidates);
	let changed = true;
	while (changed) {
		changed = false;
		for (const candidate of valid.values()) {
			if (candidate.parentCigGuid && !valid.has(candidate.parentCigGuid)) {
				valid.delete(candidate.cigGuid);
				invalid.add(candidate.cigGuid);
				invalidParentCount++;
				sample(invalidParentSamples, `${candidate.cigGuid} -> ${candidate.parentCigGuid}`);
				changed = true;
			}
		}
	}

	const locations = Array.from(valid.values());
	locations.sort((left, right) => {
		const leftDepth = depth(left, valid);
		const rightDepth = depth(right, valid);
		return leftDepth - rightDepth || left.cigGuid.localeCompare(right.cigGuid);
	});
	dependencies.logger.info("Location ingestion anomalies", {
		duplicateCount,
		duplicateSamples,
		invalidParentCount,
		invalidParentSamples,
		unresolvedRecordCount,
		unresolvedRecordSamples
	});
	return {
		locations,
		invalidCigGuids: Array.from(invalid),
		duplicateCount,
		invalidParentCount
	};
}

function depth(location: IngestLocation, locations: Map<string, IngestLocation>): number {
	let result = 0;
	const visited = new Set([location.cigGuid]);
	let parent = location.parentCigGuid ? locations.get(location.parentCigGuid) : undefined;
	while (parent) {
		if (visited.has(parent.cigGuid))
			throw new Error(`Location parent cycle includes ${parent.cigGuid}`);
		visited.add(parent.cigGuid);
		result++;
		parent = parent.parentCigGuid ? locations.get(parent.parentCigGuid) : undefined;
	}
	return result;
}
