import { MutationCommand } from "@versetools/core/commands";
import { deleteAll } from "@versetools/core/helpers";

import type { DataModel } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";
import type { GameLocation } from "$convex/app/schema/gameLocations";

import { LocationSubtreeQuery } from "./LocationSubtreeQuery";

export class DeleteLocationMutation extends MutationCommand<DataModel> {
	constructor(readonly location: GameLocation) {
		super();
	}

	async execute(ctx: MutationCtx) {
		const subtree = await this.runner.query(ctx, new LocationSubtreeQuery(this.location._id));

		for (const closure of subtree) {
			const locationId = closure.descendantId;
			await ctx.db.delete("gameLocations", locationId);

			const allRelations = [
				...(await ctx.db
					.query("gameLocationClosures")
					.withIndex("by_ancestorId", (q) => q.eq("ancestorId", locationId))
					.collect()),
				...(await ctx.db
					.query("gameLocationClosures")
					.withIndex("by_descendantId", (q) => q.eq("descendantId", locationId))
					.collect())
			];
			await deleteAll(ctx.db, "gameLocationClosures", allRelations);
		}
	}
}
