import { api } from "$convex/_generated/api";
import { createHttpClient } from "@versetools/convex-client";

import { assertConvexReachable } from "./convex";
import { batchLocations, extractLocations, snapshotHash } from "./locations";

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

const url = process.env.CONVEX_URL;
const secret = process.env.CONVEX_SECRET;
if (!url || !secret) throw new Error("CONVEX_URL and CONVEX_SECRET must be configured");
await assertConvexReachable(url);

const snapshot = extractLocations();
const batches = batchLocations(snapshot);
console.info("Extracted location snapshot", {
	locations: snapshot.locations.length,
	invalidLocations: snapshot.invalidCigGuids.length,
	batches: batches.length,
	snapshotHash: snapshotHash(snapshot)
});

const db = createHttpClient({ url, secret, logger: false });
const generationId = requireSuccess(
	"locations.beginImport",
	await db.safeMutation(api.locations.beginImport, {
		snapshotHash: snapshotHash(snapshot),
		expectedBatchCount: batches.length
	})
);

try {
	for (const [batchNumber, batch] of batches.entries()) {
		requireSuccess(
			`locations.reconcileImportBatch batch ${batchNumber}`,
			await db.safeMutation(api.locations.reconcileImportBatch, {
				generationId,
				batchNumber,
				...batch
			})
		);
	}

	await runUntilDone("locations.finalizeImport", () =>
		db.safeMutation(api.locations.finalizeImport, { generationId })
	);
	await runUntilDone("locations.rebuildImportClosures", () =>
		db.safeMutation(api.locations.rebuildImportClosures, { generationId })
	);
} catch (error) {
	try {
		requireSuccess(
			"locations.abortImport",
			await db.safeMutation(api.locations.abortImport, { generationId })
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
