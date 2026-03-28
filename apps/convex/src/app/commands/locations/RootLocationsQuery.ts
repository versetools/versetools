import { QueryCommand } from "@versetools/core/commands";

import type { DataModel } from "$convex/_generated/dataModel";
import type { QueryableCtx } from "$convex/app/dataModel";

export class RootLocationsQuery extends QueryCommand<DataModel> {
	constructor() {
		super();
	}

	async execute(ctx: QueryableCtx) {
		return await ctx.db
			.query("gameLocations")
			.withIndex("by_parentId", (q) => q.eq("parentId", null))
			.collect();
	}
}
