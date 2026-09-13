import { QueryCommand } from "@versetools/core/commands";

import type { DataModel } from "$convex/_generated/dataModel";
import type { QueryableCtx } from "$convex/app/dataModel";

export class ActiveLocationClosureRebuildQuery extends QueryCommand<DataModel> {
	async execute(ctx: QueryableCtx) {
		return await ctx.db
			.query("locationClosureRebuilds")
			.withIndex("by_active", (q) => q.eq("active", true))
			.first();
	}
}
