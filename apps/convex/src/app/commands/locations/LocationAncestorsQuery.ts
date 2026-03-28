import { QueryCommand } from "@versetools/core/commands";

import type { DataModel, Id } from "$convex/_generated/dataModel";
import type { QueryableCtx } from "$convex/app/dataModel";
import type { GameLocationClosure } from "$convex/app/schema/gameLocations";

export class LocationAncestorsQuery extends QueryCommand<DataModel> {
	constructor(readonly locationId: Id<"gameLocations">) {
		super();
	}

	async execute(ctx: QueryableCtx): Promise<GameLocationClosure[]> {
		const ancestors = await ctx.db
			.query("gameLocationClosures")
			.withIndex("by_descendantId", (q) => q.eq("descendantId", this.locationId))
			.filter((q) => q.not(q.eq(q.field("depth"), 0)))
			.collect();

		ancestors.sort((a, b) => b.depth - a.depth); // Decending

		return ancestors;
	}
}
