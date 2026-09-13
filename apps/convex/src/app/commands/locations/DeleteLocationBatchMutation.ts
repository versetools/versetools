import { MutationCommand } from "@versetools/core/commands";
import { deleteAll } from "@versetools/core/helpers";

import type { DataModel, Id } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";

const DELETE_BATCH_SIZE = 25;

export class DeleteLocationBatchMutation extends MutationCommand<DataModel> {
	constructor(readonly locationIds: Id<"locations">[]) {
		super();
	}

	async execute(ctx: MutationCtx) {
		for (const locationId of this.locationIds) {
			if (!(await ctx.db.get("locations", locationId))) continue;
			const properties = await ctx.db
				.query("locationProperties")
				.withIndex("by_locationId", (q) => q.eq("locationId", locationId))
				.take(DELETE_BATCH_SIZE);
			if (properties.length > 0) {
				await deleteAll(ctx.db, "locationProperties", properties);
				return false;
			}
			const ancestorClosures = await ctx.db
				.query("locationClosures")
				.withIndex("by_ancestorId", (q) => q.eq("ancestorId", locationId))
				.take(DELETE_BATCH_SIZE);
			if (ancestorClosures.length > 0) {
				await deleteAll(ctx.db, "locationClosures", ancestorClosures);
				return false;
			}
			const descendantClosures = await ctx.db
				.query("locationClosures")
				.withIndex("by_descendantId", (q) => q.eq("descendantId", locationId))
				.take(DELETE_BATCH_SIZE);
			if (descendantClosures.length > 0) {
				await deleteAll(ctx.db, "locationClosures", descendantClosures);
				return false;
			}
			await ctx.db.delete("locations", locationId);
		}
		return true;
	}
}
