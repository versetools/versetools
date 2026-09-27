import { QueryCommand } from "@versetools/core/commands";
import { ResultError } from "@versetools/core/errors";
import { MAX_LOCATION_TREE_PROPERTIES } from "@versetools/types";

import type { DataModel } from "$convex/_generated/dataModel";
import type { QueryableCtx } from "$convex/app/dataModel";

export class AllLocationPropertiesQuery extends QueryCommand<DataModel> {
	constructor(readonly limit = MAX_LOCATION_TREE_PROPERTIES) {
		super();
	}

	async execute(ctx: QueryableCtx) {
		const properties = await ctx.db.query("locationProperties").take(this.limit + 1);
		if (properties.length > this.limit)
			throw new ResultError("LOCATION_PROPERTY_READ_LIMIT_EXCEEDED", {
				limit: this.limit
			});
		return properties;
	}
}
