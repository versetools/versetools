import { QueryCommand } from "@versetools/core/commands";
import { xf } from "@versetools/core/helpers";

import type { DataModel, Id } from "$convex/_generated/dataModel";
import type { QueryableCtx } from "$convex/app/dataModel";
import type { LocationClosure } from "$convex/app/schema/locations";

import { LocationSubtreeQuery } from "./LocationSubtreeQuery";

export class LocationInverseSubtreeQuery extends QueryCommand<DataModel> {
	constructor(readonly locationId: Id<"locations">) {
		super();
	}

	async execute(ctx: QueryableCtx) {
		const subtree = await this.runner.query(new LocationSubtreeQuery(this.locationId));
		const subtreeIds = subtree.map((c) => c.descendantId);

		let inverseSubtree: LocationClosure[] = [];

		for (const closure of subtree) {
			const ancestorsAboveRoot = await ctx.db
				.query("locationClosures")
				.withIndex("by_descendantId", (q) => q.eq("descendantId", closure.descendantId))
				.filter((q) => xf(q, (q) => q.not(q.in(q.field("ancestorId"), subtreeIds))))
				.collect();

			inverseSubtree = [...inverseSubtree, ...ancestorsAboveRoot];
		}

		return inverseSubtree;
	}
}
