import { RunnerService } from "@versetools/core/services/commands/RunnerService";
import { SubscriptionRegistry } from "@versetools/core/services/commands/subscriptions/SubscriptionRegistry";
import { LocationType, WorldSpace } from "@versetools/types";
import { convexTest } from "convex-test";
import { expect, test } from "vitest";

import type { DataModel, Id } from "$convex/_generated/dataModel";
import { UpdateLocationMutation } from "$convex/app/commands/locations/UpdateLocationMutation";

import schema from "./schema";
import { modules } from "./test.setup";

const locationData = {
	description: null,
	type: LocationType.Planet,
	sourceTypeName: "Planet",
	typeCigGuid: null,
	worldSpace: WorldSpace.Solar,
	surface: false,
	position: [0, 0, 0],
	rotation: null
};

async function insertTree(
	t: ReturnType<typeof convexTest>,
	parentIndexes: (number | null)[]
): Promise<Id<"locations">[]> {
	return await t.run(async (ctx) => {
		const ids: Id<"locations">[] = [];
		for (const [index, parentIndex] of parentIndexes.entries()) {
			ids.push(
				await ctx.db.insert("locations", {
					...locationData,
					cigGuid: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
					name: `Location ${index}`,
					parentId: parentIndex === null ? null : ids[parentIndex]!
				})
			);
		}

		for (const [descendantIndex, descendantId] of ids.entries()) {
			let ancestorIndex: number | null = descendantIndex;
			let depth = 0;
			while (ancestorIndex !== null) {
				await ctx.db.insert("locationClosures", {
					ancestorId: ids[ancestorIndex]!,
					descendantId,
					depth
				});
				ancestorIndex = parentIndexes[ancestorIndex]!;
				depth++;
			}
		}
		return ids;
	});
}

test("routes a move with over 100 old deletions plus new creations through bounded rebuild", async () => {
	const t = convexTest(schema, modules);
	// Five old ancestors, six new ancestors, and ten subtree nodes produce 50 + 60 mutations.
	const ids = await insertTree(t, [
		null,
		0,
		1,
		2,
		3,
		4,
		null,
		6,
		7,
		8,
		9,
		10,
		4,
		12,
		13,
		14,
		15,
		16,
		17,
		18,
		19,
		20
	]);

	await t.run(async (ctx) => {
		const runner = new RunnerService(ctx, new SubscriptionRegistry<DataModel>());
		await runner.mutation(new UpdateLocationMutation({ id: ids[12]!, parentId: ids[11]! }));
	});

	await t.run(async (ctx) => {
		expect((await ctx.db.get("locations", ids[12]!))?.parentId).toBe(ids[11]);
		expect(
			await ctx.db
				.query("locationClosureRebuilds")
				.withIndex("by_active", (q) => q.eq("active", true))
				.unique()
		).toMatchObject({ phase: "clearing", generationId: null });
		// The bounded path leaves old closures for the scheduled rebuild instead of deleting them inline.
		expect(
			await ctx.db
				.query("locationClosures")
				.withIndex("by_ancestorId_and_descendantId", (q) =>
					q.eq("ancestorId", ids[0]!).eq("descendantId", ids[12]!)
				)
				.unique()
		).not.toBeNull();
	});
});

test("keeps a small move synchronous", async () => {
	const t = convexTest(schema, modules);
	const ids = await insertTree(t, [null, 0, null, 2]);

	await t.run(async (ctx) => {
		const runner = new RunnerService(ctx, new SubscriptionRegistry<DataModel>());
		await runner.mutation(new UpdateLocationMutation({ id: ids[1]!, parentId: ids[3]! }));
	});

	await t.run(async (ctx) => {
		expect((await ctx.db.get("locations", ids[1]!))?.parentId).toBe(ids[3]);
		expect(await ctx.db.query("locationClosureRebuilds").collect()).toEqual([]);
		expect(
			await ctx.db
				.query("locationClosures")
				.withIndex("by_ancestorId_and_descendantId", (q) =>
					q.eq("ancestorId", ids[0]!).eq("descendantId", ids[1]!)
				)
				.unique()
		).toBeNull();
		expect(
			await ctx.db
				.query("locationClosures")
				.withIndex("by_ancestorId_and_descendantId", (q) =>
					q.eq("ancestorId", ids[2]!).eq("descendantId", ids[1]!)
				)
				.unique()
		).toMatchObject({ depth: 2 });
	});
});
