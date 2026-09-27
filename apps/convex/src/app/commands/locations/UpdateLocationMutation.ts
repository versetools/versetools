import { MutationCommand } from "@versetools/core/commands";
import { ResultError } from "@versetools/core/errors";
import type { UpdateLocationSchema } from "@versetools/types";
import type * as z from "zod";

import { internal } from "$convex/_generated/api";
import type { DataModel } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";

import { ActiveLocationClosureRebuildQuery } from "./ActiveLocationClosureRebuildQuery";
import { MoveLocationMutation } from "./MoveLocationMutation";
import { UpdateLocationDataMutation } from "./UpdateLocationDataMutation";

export const MAX_SYNCHRONOUS_MOVE_CLOSURE_MUTATIONS = 100;

export class UpdateLocationMutation extends MutationCommand<DataModel> {
	constructor(readonly input: z.infer<typeof UpdateLocationSchema>) {
		super();
	}

	async execute(ctx: MutationCtx) {
		const location = await ctx.db.get("locations", this.input.id);
		if (!location) return false;

		await this.runner.mutation(new UpdateLocationDataMutation(location, this.input));
		if (this.input.parentId !== undefined && location.parentId !== this.input.parentId) {
			const parentId = this.input.parentId ?? null;
			const subtree = await ctx.db
				.query("locationClosures")
				.withIndex("by_ancestorId", (q) => q.eq("ancestorId", location._id))
				.take(101);
			const ancestors = parentId
				? await ctx.db
						.query("locationClosures")
						.withIndex("by_descendantId", (q) => q.eq("descendantId", parentId))
						.take(101)
				: [];
			const oldAncestors = location.parentId
				? await ctx.db
						.query("locationClosures")
						.withIndex("by_descendantId", (q) => q.eq("descendantId", location._id))
						.filter((q) => q.neq(q.field("depth"), 0))
						.take(101)
				: [];
			const estimatedClosureMutations = subtree.length * (oldAncestors.length + ancestors.length);
			if (estimatedClosureMutations > MAX_SYNCHRONOUS_MOVE_CLOSURE_MUTATIONS) {
				if (await this.runner.query(new ActiveLocationClosureRebuildQuery())) {
					throw new ResultError("LOCATION_TREE_REBUILDING");
				}
				await ctx.db.patch("locations", location._id, { parentId });
				await ctx.db.insert("locationClosureRebuilds", {
					active: true,
					generationId: null,
					phase: "clearing",
					rootCursor: null
				});
				await ctx.scheduler.runAfter(0, internal.locations.rebuildClosures, {});
			} else {
				await this.runner.mutation(new MoveLocationMutation(location, parentId));
			}
		}
		return true;
	}
}
