import { QueryCommand } from "@versetools/core/commands";

import type { DataModel } from "$convex/_generated/dataModel";
import type { QueryableCtx } from "$convex/app/dataModel";

export class LocationByCigGuidQuery extends QueryCommand<DataModel> {
	constructor(readonly cigGuid: string) {
		super();
	}

	async execute(ctx: QueryableCtx) {
		return await ctx.db
			.query("locations")
			.withIndex("by_cigGuid", (q) => q.eq("cigGuid", this.cigGuid))
			.unique();
	}
}
