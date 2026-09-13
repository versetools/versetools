import { convexTest } from "convex-test";
import { expect, test } from "vitest";

import { ActiveLocationClosureRebuildQuery } from "$convex/app/commands/locations/ActiveLocationClosureRebuildQuery";

import schema from "./schema";
import { modules } from "./test.setup";

test("reports an active location closure rebuild", async () => {
	const t = convexTest(schema, modules);
	await t.run(async (ctx) => {
		await ctx.db.insert("locationClosureRebuilds", {
			active: true,
			generationId: null,
			phase: "clearing",
			rootCursor: null
		});
	});

	expect(
		await t.query(async (ctx) => await new ActiveLocationClosureRebuildQuery().execute(ctx))
	).toMatchObject({ active: true });
});
