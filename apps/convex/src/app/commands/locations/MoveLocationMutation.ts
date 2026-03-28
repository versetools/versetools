import { MutationCommand } from "@versetools/core/commands";
import { deleteAll } from "@versetools/core/helpers";

import type { DataModel, Id } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";
import type { GameLocation } from "$convex/app/schema/gameLocations";

import { LocationAncestorsQuery } from "./LocationAncestorsQuery";
import { LocationInverseSubtreeQuery } from "./LocationInverseSubtreeQuery";
import { LocationSubtreeQuery } from "./LocationSubtreeQuery";

export class MoveLocationMutation extends MutationCommand<DataModel> {
	constructor(
		readonly location: GameLocation,
		readonly parentId: Id<"gameLocations"> | null
	) {
		super();
	}

	async execute(ctx: MutationCtx) {
		if (this.location.parentId === this.parentId) {
			return;
		}

		await ctx.db.patch("gameLocations", this.location._id, {
			parentId: this.parentId
		});

		if (this.location.parentId) {
			// Delete inverse subtree (all connections to the tree above this location)
			const closures = await this.runner.query(
				ctx,
				new LocationInverseSubtreeQuery(this.location._id)
			);
			await deleteAll(ctx.db, "gameLocationClosures", closures);
		}

		if (this.parentId) {
			// Create inverse subtree
			const subtree = await this.runner.query(ctx, new LocationSubtreeQuery(this.location._id));
			const parentAncestors = await this.runner.query(
				ctx,
				new LocationAncestorsQuery(this.parentId)
			);

			await Promise.all(
				subtree.map(async (closure) => {
					await ctx.db.insert("gameLocationClosures", {
						ancestorId: this.parentId!,
						descendantId: closure.descendantId,
						depth: closure.depth + 1
					});

					await Promise.all(
						parentAncestors.map((ancestor) =>
							ctx.db.insert("gameLocationClosures", {
								ancestorId: ancestor.ancestorId,
								descendantId: closure.descendantId,
								depth: ancestor.depth + closure.depth + 1
							})
						)
					);
				})
			);
		}
	}
}
