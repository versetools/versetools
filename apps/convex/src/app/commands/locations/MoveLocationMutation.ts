import { MutationCommand } from "@versetools/core/commands";
import { deleteAll } from "@versetools/core/helpers";

import type { DataModel, Id } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";
import type { Location } from "$convex/app/schema/locations";

import { LocationAncestorsQuery } from "./LocationAncestorsQuery";
import { LocationInverseSubtreeQuery } from "./LocationInverseSubtreeQuery";
import { LocationSubtreeQuery } from "./LocationSubtreeQuery";

export class MoveLocationMutation extends MutationCommand<DataModel> {
	constructor(
		readonly location: Location,
		readonly parentId: Id<"locations"> | null
	) {
		super();
	}

	async execute(ctx: MutationCtx) {
		if (this.location.parentId === this.parentId) {
			return;
		}

		const parent = this.parentId ? await ctx.db.get("locations", this.parentId) : null;

		await ctx.db.patch("locations", this.location._id, {
			parentId: parent?._id ?? null
		});

		if (this.location.parentId) {
			// Delete inverse subtree (all connections to the tree above this location)
			const closures = await this.runner.query(new LocationInverseSubtreeQuery(this.location._id));
			await deleteAll(ctx.db, "locationClosures", closures);
		}

		if (parent?._id) {
			// Create inverse subtree
			const subtree = await this.runner.query(new LocationSubtreeQuery(this.location._id));
			const parentAncestors = await this.runner.query(new LocationAncestorsQuery(parent._id));

			await Promise.all(
				subtree.map(async (closure) => {
					await ctx.db.insert("locationClosures", {
						ancestorId: parent._id,
						descendantId: closure.descendantId,
						depth: closure.depth + 1
					});

					await Promise.all(
						parentAncestors.map((ancestor) =>
							ctx.db.insert("locationClosures", {
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
