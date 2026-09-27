import { QueryCommand } from "@versetools/core/commands";
import { ResultError } from "@versetools/core/errors";
import type { FindLocationsByPropertySchema } from "@versetools/types";
import type * as z from "zod";

import type { DataModel } from "$convex/_generated/dataModel";
import type { QueryableCtx } from "$convex/app/dataModel";
import { LocationTransformer } from "$convex/app/transformers/LocationTransformer";

import { ActiveLocationClosureRebuildQuery } from "./ActiveLocationClosureRebuildQuery";

export class LocationsByPropertyQuery extends QueryCommand<DataModel> {
	constructor(readonly input: z.infer<typeof FindLocationsByPropertySchema>) {
		super();
	}

	async execute(ctx: QueryableCtx) {
		if (await this.runner.query(new ActiveLocationClosureRebuildQuery()))
			throw new ResultError("LOCATION_TREE_REBUILDING");
		const properties = await ctx.db
			.query("locationProperties")
			.withIndex("by_type_and_value", (q) =>
				q.eq("type", this.input.type).eq("value", this.input.value)
			)
			.paginate({
				cursor: this.input.paginationOpts.cursor,
				numItems: this.input.paginationOpts.numItems ?? 25
			});

		return {
			...properties,
			page: await Promise.all(
				properties.page.map(async (property) => {
					const location = await ctx.db.get("locations", property.locationId);
					if (!location)
						throw new ResultError("LOCATION_PROPERTY_LOCATION_MISSING", {
							propertyId: property._id,
							locationId: property.locationId
						});
					const locationProperties = await ctx.db
						.query("locationProperties")
						.withIndex("by_locationId_and_type_and_value", (q) => q.eq("locationId", location._id))
						.collect();
					return LocationTransformer.transform(
						location,
						LocationTransformer.groupProperties(locationProperties)
					);
				})
			)
		};
	}
}
