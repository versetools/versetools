import { QueryCommand } from "@versetools/core/commands";

import type { DataModel, Id } from "$convex/_generated/dataModel";
import type { QueryableCtx } from "$convex/app/dataModel";

export class LocationSubtreeQuery extends QueryCommand<DataModel> {
	constructor(readonly locationId: Id<"gameLocations">) {
		super();
	}

	async execute(ctx: QueryableCtx) {
		const subtree = await ctx.db
			.query("gameLocationClosures")
			.withIndex("by_ancestorId", (q) => q.eq("ancestorId", this.locationId))
			.collect();

		subtree.sort((a, b) => a.depth - b.depth);

		return subtree;
	}
}
