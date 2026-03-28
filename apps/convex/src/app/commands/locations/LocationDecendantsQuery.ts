import { QueryCommand } from "@versetools/core/commands";

import type { DataModel, Id } from "$convex/_generated/dataModel";
import type { QueryableCtx } from "$convex/app/dataModel";

import { LocationSubtreeQuery } from "./LocationSubtreeQuery";

export class LocationDecendantsQuery extends QueryCommand<DataModel> {
	constructor(readonly locationId: Id<"gameLocations">) {
		super();
	}

	async execute(ctx: QueryableCtx) {
		const subtree = await this.runner.query(ctx, new LocationSubtreeQuery(this.locationId));

		const descendants = subtree.filter((c) => c.depth !== 0);

		return descendants;
	}
}
