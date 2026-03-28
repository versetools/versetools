import type { DataModel } from "$convex/_generated/dataModel";
import { QueryCommand } from "@versetools/core/commands";

import type { QueryableCtx } from "../../dataModel";

export class FeatureFlagQuery extends QueryCommand<DataModel> {
	constructor(readonly key: string) {
		super();
	}

	async execute(ctx: QueryableCtx) {
		return await ctx.db
			.query("featureFlags")
			.withIndex("by_key", (q) => q.eq("key", this.key))
			.unique();
	}
}
