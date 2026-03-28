import { QueryCommand } from "@versetools/core/commands";
import { ResultError } from "@versetools/core/errors";
import { pruneNull } from "convex-helpers";
import { getAll } from "convex-helpers/server/relationships";

import type { DataModel, Id } from "$convex/_generated/dataModel";
import type { QueryableCtx } from "$convex/app/dataModel";
import type { GameLocation } from "$convex/app/schema/gameLocations";

import { LocationSubtreeQuery } from "./LocationSubtreeQuery";

export type LocationWithChildren = GameLocation & {
	children?: LocationWithChildren[];
};

export class LocationTreeQuery extends QueryCommand<DataModel> {
	constructor(readonly locationId: Id<"gameLocations">) {
		super();
	}

	async execute(ctx: QueryableCtx) {
		const tree = await this.runner.query(ctx, new LocationSubtreeQuery(this.locationId));

		const locations = pruneNull(
			await getAll(
				ctx.db,
				tree.map((closure) => closure.descendantId)
			)
		);

		const rootId = tree.find((c) => c.depth === 0)?.descendantId;
		if (!rootId) {
			throw new ResultError("LOCATION_TREE_MISSING_ROOT_CLOSURE");
		}

		const root = locations.find((l) => l._id === rootId) as LocationWithChildren | undefined;
		if (!root) {
			throw new ResultError("LOCATION_TREE_MISSING_ROOT_LOCATION");
		}

		let parents = [root];
		let depth = 0;
		while (true) {
			depth++;

			const locationsAtDepth = tree
				.filter((c) => c.depth === depth)
				.map((c) => {
					const location = locations.find((l) => l._id === c.descendantId);
					if (!location) {
						throw new ResultError("ORPHAN_LOCATION_CLOSURE", {
							closureId: c._id,
							locationId: c.descendantId
						});
					}
					return location;
				});

			if (locationsAtDepth.length === 0) {
				break;
			}

			const newParents = [];

			for (const location of locationsAtDepth) {
				const parent = parents.find((p) => p._id === location.parentId) as
					| LocationWithChildren
					| undefined;
				if (!parent) {
					throw new ResultError("LOCATION_MISSING_PARENT", {
						locationId: location._id,
						parentId: location.parentId,
						parentIds: parents.map((p) => p._id),
						depth
					});
				}

				parent.children ??= [];
				parent.children.push(location);

				newParents.push(location);
			}

			parents = newParents;
		}

		return root;
	}
}
