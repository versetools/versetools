import type { MutationCommand, MutationValue } from "@versetools/core/commands";
import { RunnerService } from "@versetools/core/services/commands/RunnerService";
import { SubscriptionRegistry } from "@versetools/core/services/commands/subscriptions/SubscriptionRegistry";
import { LocationType, WorldSpace } from "@versetools/types";
import { convexTest, type TestConvexForDataModel } from "convex-test";
import { expect, test } from "vitest";

import type { DataModel, Id } from "$convex/_generated/dataModel";
import { AbortLocationImportMutation } from "$convex/app/commands/locations/AbortLocationImportMutation";
import { BeginLocationImportMutation } from "$convex/app/commands/locations/BeginLocationImportMutation";
import { FinalizeLocationImportMutation } from "$convex/app/commands/locations/FinalizeLocationImportMutation";
import { RebuildLocationClosuresMutation } from "$convex/app/commands/locations/RebuildLocationClosuresMutation";
import { ReconcileLocationImportBatchMutation } from "$convex/app/commands/locations/ReconcileLocationImportBatchMutation";

import schema from "./schema";
import { modules } from "./test.setup";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const GUIDS = {
	root: "00000000-0000-4000-8000-000000000001",
	oldParent: "00000000-0000-4000-8000-000000000002",
	newParent: "00000000-0000-4000-8000-000000000003",
	child: "00000000-0000-4000-8000-000000000004",
	created: "00000000-0000-4000-8000-000000000005",
	invalidParent: "00000000-0000-4000-8000-000000000006",
	invalidChild: "00000000-0000-4000-8000-000000000007",
	staleParent: "00000000-0000-4000-8000-000000000008",
	staleChild: "00000000-0000-4000-8000-000000000009"
} as const;

type TestConvex = TestConvexForDataModel<DataModel>;

const locationInput = (cigGuid: string, name: string, parentCigGuid: string | null = null) => ({
	cigGuid,
	name,
	description: null,
	type: LocationType.PointOfInterest,
	sourceTypeName: "TestLocation",
	typeCigGuid: null,
	worldSpace: WorldSpace.Local,
	surface: false,
	position: { x: 1, y: 2, z: 3 },
	rotation: null,
	parentCigGuid
});

const runMutation = async <Command extends MutationCommand<DataModel>>(
	t: TestConvex,
	command: Command
): Promise<MutationValue<Command>> =>
	await t.mutation(async (ctx) => {
		const runner = new RunnerService(ctx, new SubscriptionRegistry<DataModel>());
		return await runner.mutation(command);
	});

const insertLocation = async (
	t: TestConvex,
	cigGuid: string,
	name: string,
	parentId: Id<"locations"> | null = null
) => {
	const { parentCigGuid: _parentCigGuid, ...input } = locationInput(cigGuid, name);
	return await t.run(
		async (ctx) =>
			await ctx.db.insert("locations", {
				...input,
				position: [1, 2, 3],
				parentId
			})
	);
};

const beginImport = async (t: TestConvex, expectedBatchCount = 1, snapshotHash = HASH_A) =>
	await runMutation(t, new BeginLocationImportMutation({ snapshotHash, expectedBatchCount }));

test("reconciles creates and updates while preserving IDs across reparenting", async () => {
	const t = convexTest(schema, modules);
	const oldParentId = await insertLocation(t, GUIDS.oldParent, "Old parent");
	const newParentId = await insertLocation(t, GUIDS.newParent, "New parent");
	const childId = await insertLocation(t, GUIDS.child, "Old child name", oldParentId);
	const generationId = await beginImport(t);

	await runMutation(
		t,
		new ReconcileLocationImportBatchMutation({
			generationId,
			batchNumber: 0,
			batchHash: HASH_B,
			locations: [
				locationInput(GUIDS.newParent, "Updated parent"),
				locationInput(GUIDS.child, "Updated child", GUIDS.newParent),
				locationInput(GUIDS.created, "Created", GUIDS.newParent)
			],
			invalidCigGuids: [GUIDS.oldParent]
		})
	);

	const state = await t.run(async (ctx) => ({
		locations: await ctx.db.query("locations").collect(),
		members: await ctx.db
			.query("locationImportMembers")
			.withIndex("by_generationId", (q) => q.eq("generationId", generationId))
			.collect()
	}));
	const child = state.locations.find((location) => location.cigGuid === GUIDS.child);
	const newParent = state.locations.find((location) => location.cigGuid === GUIDS.newParent);
	expect(child).toMatchObject({ _id: childId, name: "Updated child", parentId: newParentId });
	expect(newParent).toMatchObject({ _id: newParentId, name: "Updated parent" });
	expect(state.locations.find((location) => location.cigGuid === GUIDS.created)?._id).toBeDefined();
	expect(state.members.map(({ cigGuid, status }) => ({ cigGuid, status }))).toEqual(
		expect.arrayContaining([
			{ cigGuid: GUIDS.newParent, status: "valid" },
			{ cigGuid: GUIDS.child, status: "valid" },
			{ cigGuid: GUIDS.created, status: "valid" },
			{ cigGuid: GUIDS.oldParent, status: "invalid" }
		])
	);
});

test("aborts an import before its first batch", async () => {
	const t = convexTest(schema, modules);
	const generationId = await beginImport(t);

	await runMutation(t, new AbortLocationImportMutation({ generationId }));

	const state = await t.run(async (ctx) => ({
		generation: await ctx.db.get("locationImportGenerations", generationId),
		rebuilds: await ctx.db.query("locationClosureRebuilds").collect()
	}));
	expect(state.generation).toBeNull();
	expect(state.rebuilds).toEqual([]);
	expect(await beginImport(t)).not.toBe(generationId);
});

test("rejects abort after a batch and resumes idempotently", async () => {
	const t = convexTest(schema, modules);
	const generationId = await beginImport(t);
	const batch = {
		generationId,
		batchNumber: 0,
		batchHash: HASH_B,
		locations: [locationInput(GUIDS.root, "Root")],
		invalidCigGuids: []
	};
	await runMutation(t, new ReconcileLocationImportBatchMutation(batch));

	await expect(
		runMutation(t, new AbortLocationImportMutation({ generationId }))
	).rejects.toMatchObject({ data: { type: "LOCATION_IMPORT_CANNOT_ABORT" } });
	expect(await beginImport(t)).toBe(generationId);
	await runMutation(t, new ReconcileLocationImportBatchMutation(batch));

	const generation = await t.run(
		async (ctx) => await ctx.db.get("locationImportGenerations", generationId)
	);
	expect(generation?.completedBatchCount).toBe(1);
});

test("does not finalize an incomplete import or start cleanup", async () => {
	const t = convexTest(schema, modules);
	const staleId = await insertLocation(t, GUIDS.staleParent, "Stale");
	const generationId = await beginImport(t, 2);
	await runMutation(
		t,
		new ReconcileLocationImportBatchMutation({
			generationId,
			batchNumber: 0,
			batchHash: HASH_B,
			locations: [locationInput(GUIDS.root, "Root")],
			invalidCigGuids: []
		})
	);

	await expect(
		runMutation(t, new FinalizeLocationImportMutation({ generationId }))
	).rejects.toMatchObject({ data: { type: "LOCATION_IMPORT_INCOMPLETE" } });

	const state = await t.run(async (ctx) => ({
		stale: await ctx.db.get("locations", staleId),
		generation: await ctx.db.get("locationImportGenerations", generationId)
	}));
	expect(state.stale).not.toBeNull();
	expect(state.generation).toMatchObject({ cleanupComplete: false, cleanupCursor: null });
});

test("deletes stale and invalid subtrees with their closure and property rows in bounded work", async () => {
	const t = convexTest({ schema, modules, transactionLimits: true });
	const rootId = await insertLocation(t, GUIDS.root, "Root");
	const invalidParentId = await insertLocation(t, GUIDS.invalidParent, "Invalid parent", rootId);
	const invalidChildId = await insertLocation(
		t,
		GUIDS.invalidChild,
		"Invalid child",
		invalidParentId
	);
	const staleParentId = await insertLocation(t, GUIDS.staleParent, "Stale parent", rootId);
	const staleChildId = await insertLocation(t, GUIDS.staleChild, "Stale child", staleParentId);
	const removedIds = [invalidParentId, invalidChildId, staleParentId, staleChildId];
	await t.run(async (ctx) => {
		const treeIds = [rootId, ...removedIds];
		for (const ancestorId of treeIds)
			for (const descendantId of treeIds)
				await ctx.db.insert("locationClosures", { ancestorId, descendantId, depth: 1 });
		for (const locationId of removedIds)
			for (let index = 0; index < 30; index++)
				await ctx.db.insert("locationProperties", {
					locationId,
					key: `key-${index}`,
					value: `value-${index}`
				});
	});
	const generationId = await beginImport(t);
	await runMutation(
		t,
		new ReconcileLocationImportBatchMutation({
			generationId,
			batchNumber: 0,
			batchHash: HASH_B,
			locations: [locationInput(GUIDS.root, "Updated root")],
			invalidCigGuids: [GUIDS.invalidParent, GUIDS.invalidChild]
		})
	);

	let cleanupDone = false;
	for (let attempt = 0; attempt < 100 && !cleanupDone; attempt++)
		cleanupDone = await runMutation(t, new FinalizeLocationImportMutation({ generationId }));
	expect(cleanupDone).toBe(true);

	let rebuildDone = false;
	for (let attempt = 0; attempt < 100 && !rebuildDone; attempt++)
		rebuildDone = await runMutation(t, new RebuildLocationClosuresMutation(generationId));
	expect(rebuildDone).toBe(true);

	const state = await t.run(async (ctx) => ({
		locations: await ctx.db.query("locations").collect(),
		properties: await ctx.db.query("locationProperties").collect(),
		closures: await ctx.db.query("locationClosures").collect(),
		generation: await ctx.db.get("locationImportGenerations", generationId)
	}));
	expect(state.locations).toHaveLength(1);
	expect(state.locations[0]).toMatchObject({ _id: rootId, name: "Updated root" });
	expect(state.properties).toEqual([]);
	expect(
		state.closures.some(
			(closure) =>
				removedIds.includes(closure.ancestorId) || removedIds.includes(closure.descendantId)
		)
	).toBe(false);
	expect(state.generation).toMatchObject({ cleanupComplete: true, finalized: true });
});
