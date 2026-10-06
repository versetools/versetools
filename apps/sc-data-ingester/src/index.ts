import { api } from "$convex/_generated/api";
import { createHttpClient } from "@versetools/convex-client";
import { readDatacoreRecordsByType } from "@versetools/sc-data-extractor";
import { LocationAmenity, LocationPropertySource } from "@versetools/types";

import { assertConvexReachable } from "./convex";
import {
	batchLocations,
	extractLocations,
	isLegacyLocationSocpak,
	measureLocationSnapshot,
	snapshotHash,
	STAR_MAP_AMENITY_TYPES
} from "./locations";

const MAX_COMPLETION_ATTEMPTS = 10_000;

function requireSuccess<T>(operation: string, result: ClientResult<T>): T {
	if (!result.ok) {
		console.error(`${operation} failed`, { type: result.type, context: result.context });
		throw new Error(`${operation} failed with ${result.type}`);
	}
	return result.value;
}

async function runUntilDone(
	operation: string,
	mutation: () => Promise<ClientResult<{ done: boolean }>>
) {
	for (let attempt = 1; attempt <= MAX_COMPLETION_ATTEMPTS; attempt++) {
		if (requireSuccess(operation, await mutation()).done) return;
	}
	throw new Error(`${operation} did not complete after ${MAX_COMPLETION_ATTEMPTS} attempts`);
}

type ClientResult<T> = { ok: true; value: T } | { ok: false; type: string; context: unknown };

function amenityDefinitionName(record: unknown): string | null {
	if (!record || typeof record !== "object") return null;
	const value = (record as { _RecordValue_?: unknown })._RecordValue_;
	if (!value || typeof value !== "object") return null;
	const name = (value as { name?: unknown }).name;
	return typeof name === "string" ? name : null;
}

async function main() {
	const dryRun = process.argv.includes("--dry-run");
	const snapshot = extractLocations();
	const batches = batchLocations(snapshot);
	const currentSnapshotHash = snapshotHash(snapshot);
	const measurements = measureLocationSnapshot(snapshot);
	console.info("Extracted location snapshot", {
		locations: snapshot.locations.length,
		invalidLocations: snapshot.invalidCigGuids.length,
		batches: batches.length,
		snapshotHash: currentSnapshotHash,
		...measurements
	});

	if (dryRun) {
		const definitionNames = readDatacoreRecordsByType("StarMapAmenityTypeEntry")
			.map(amenityDefinitionName)
			.filter((name): name is string => name !== null)
			.sort();
		const unsupportedDefinitions = definitionNames.filter(
			(name) => STAR_MAP_AMENITY_TYPES[name] === undefined
		);
		if (unsupportedDefinitions.length)
			throw new Error(`Unsupported amenity definitions: ${unsupportedDefinitions.join(", ")}`);
		const legacySnapshot = extractLocations(undefined, { socpakFilter: isLegacyLocationSocpak });
		const legacyLocationIds = new Set(legacySnapshot.locations.map(({ cigGuid }) => cigGuid));
		const newlyReachableLocations = snapshot.locations
			.filter(({ cigGuid }) => !legacyLocationIds.has(cigGuid))
			.map(({ cigGuid, name }) => ({ cigGuid, name }));
		const legacyInvalidIds = new Set(legacySnapshot.invalidCigGuids);
		const newlyReachableInvalidCigGuids = snapshot.invalidCigGuids.filter(
			(cigGuid) => !legacyInvalidIds.has(cigGuid)
		);
		const referencedAmenityTypes = Array.from(
			new Set(
				snapshot.locations.flatMap((location) =>
					location.properties
						.filter((property) => property.source === LocationPropertySource.StarMapAmenity)
						.map((property) => property.value)
				)
			)
		).sort();
		const propertyNames = Array.from(
			new Map(
				snapshot.locations
					.flatMap((location) => location.properties)
					.map((property) => [
						`${property.type}\0${property.value}\0${property.name}`,
						{ type: property.type, value: property.value, name: property.name }
					])
			).values()
		).sort(
			(left, right) =>
				left.type.localeCompare(right.type) ||
				left.value.localeCompare(right.value) ||
				left.name.localeCompare(right.name)
		);
		const unreadablePropertyNames = propertyNames.filter(({ name }) => name.startsWith("@"));
		const externalFreightElevatorLocations = snapshot.locations
			.filter((location) =>
				location.properties.some(
					(property) => property.value === LocationAmenity.ExternalFreightElevator
				)
			)
			.map(({ cigGuid, name }) => ({ cigGuid, name }));
		console.info("LIVE location dry-run report", {
			amenityDefinitions: definitionNames,
			amenityDefinitionCount: definitionNames.length,
			referencedAmenityTypes,
			propertyNames,
			unreadablePropertyNames,
			externalFreightElevatorLocations,
			externalFreightElevatorLocationCount: externalFreightElevatorLocations.length,
			levski: externalFreightElevatorLocations.find(
				({ cigGuid }) => cigGuid === "468d4102-a210-47b5-8bc3-084f791a173c"
			),
			newlyReachableLocations,
			newlyReachableInvalidCigGuids,
			newlyReachableLocationCount:
				newlyReachableLocations.length + newlyReachableInvalidCigGuids.length,
			propertyCount: measurements.propertyCount,
			locationTreePropertyLimit: measurements.locationTreePropertyLimit,
			locationTreePropertyHeadroom: measurements.locationTreePropertyHeadroom
		});
		return;
	}

	const url = process.env.CONVEX_URL;
	const secret = process.env.CONVEX_SECRET;
	if (!url || !secret) throw new Error("CONVEX_URL and CONVEX_SECRET must be configured");
	await assertConvexReachable(url);
	const db = createHttpClient({ url, secret, logger: false });
	const generationId = requireSuccess(
		"locations.beginImport",
		await db.safeMutation(api.locations.beginImport, {
			secret: db.secret,
			snapshotHash: currentSnapshotHash,
			expectedBatchCount: batches.length
		})
	);

	try {
		for (const [batchNumber, batch] of batches.entries()) {
			requireSuccess(
				`locations.reconcileImportBatch batch ${batchNumber}`,
				await db.safeMutation(api.locations.reconcileImportBatch, {
					secret: db.secret,
					generationId,
					batchNumber,
					...batch
				})
			);
		}

		await runUntilDone("locations.finalizeImport", () =>
			db.safeMutation(api.locations.finalizeImport, { secret: db.secret, generationId })
		);
		await runUntilDone("locations.rebuildImportClosures", () =>
			db.safeMutation(api.locations.rebuildImportClosures, { secret: db.secret, generationId })
		);
	} catch (error) {
		try {
			requireSuccess(
				"locations.abortImport",
				await db.safeMutation(api.locations.abortImport, { secret: db.secret, generationId })
			);
		} catch (abortError) {
			// A committed batch makes the generation resumable rather than abortable.
			console.error("Failed to abort import, generation may be resumable", abortError);
		}
		throw error;
	}

	console.info("Ingested location snapshot", {
		locations: snapshot.locations.length,
		invalidLocations: snapshot.invalidCigGuids.length,
		batches: batches.length
	});
}

await main();
