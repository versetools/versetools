import type { DataModel } from "$convex/_generated/dataModel";
import { QueryCommand } from "@versetools/core/commands";
import { asyncMap } from "convex-helpers";

import type { QueryableCtx } from "../../dataModel";

export class FeatureFlagsQuery extends QueryCommand<DataModel> {
	constructor(readonly keys: string[]) {
		super();
	}

	async execute(ctx: QueryableCtx) {
		return await asyncMap(this.keys, async (key) => {
			return await ctx.db
				.query("featureFlags")
				.withIndex("by_key", (q) => q.eq("key", key))
				.unique();
		});
	}
}
