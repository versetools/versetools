import { QueryCommand } from "@versetools/core/commands";

import type { DataModel, Id } from "$convex/_generated/dataModel";
import type { QueryableCtx } from "$convex/app/dataModel";
import type { LocationClosure } from "$convex/app/schema/locations";

export class LocationAncestorsQuery extends QueryCommand<DataModel> {
	constructor(readonly locationId: Id<"locations">) {
		super();
	}

	async execute(ctx: QueryableCtx): Promise<LocationClosure[]> {
		const ancestors = await ctx.db
			.query("locationClosures")
			.withIndex("by_descendantId", (q) => q.eq("descendantId", this.locationId))
			.filter((q) => q.not(q.eq(q.field("depth"), 0)))
			.collect();

		ancestors.sort((a, b) => b.depth - a.depth); // Decending

		return ancestors;
	}
}
