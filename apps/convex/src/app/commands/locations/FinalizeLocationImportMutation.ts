import { MutationCommand } from "@versetools/core/commands";
import { ResultError } from "@versetools/core/errors";
import type { FinalizeLocationImportSchema } from "@versetools/types";
import type * as z from "zod";

import type { DataModel } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";

import { ActiveLocationClosureRebuildQuery } from "./ActiveLocationClosureRebuildQuery";
import { DeleteLocationBatchMutation } from "./DeleteLocationBatchMutation";

export class FinalizeLocationImportMutation extends MutationCommand<DataModel> {
	constructor(readonly input: z.infer<typeof FinalizeLocationImportSchema>) {
		super();
	}

	async execute(ctx: MutationCtx) {
		const generation = await ctx.db.get("locationImportGenerations", this.input.generationId);
		if (!generation || generation.completedBatchCount !== generation.expectedBatchCount)
			throw new ResultError("LOCATION_IMPORT_INCOMPLETE");
		if (generation.finalized) return true;
		const rebuild = await this.runner.query(new ActiveLocationClosureRebuildQuery());
		if (!rebuild || rebuild.generationId !== this.input.generationId)
			throw new ResultError("LOCATION_TREE_REBUILDING");
		if (rebuild.phase !== "awaitingCleanup") {
			if (generation.cleanupComplete) return true;
			throw new ResultError("LOCATION_TREE_REBUILDING");
		}
		if (generation.cleanupLocationId) {
			const deleted = await this.runner.mutation(
				new DeleteLocationBatchMutation([generation.cleanupLocationId])
			);
			if (deleted)
				await ctx.db.patch("locationImportGenerations", this.input.generationId, {
					cleanupDeletedInPass: true,
					cleanupLocationId: undefined
				});
			return false;
		}
		const page = await ctx.db
			.query("locations")
			.paginate({ cursor: generation.cleanupCursor, numItems: 25 });
		let cleanupLocationId;
		for (const location of page.page) {
			const member = await ctx.db
				.query("locationImportMembers")
				.withIndex("by_generationId_and_cigGuid", (q) =>
					q.eq("generationId", this.input.generationId).eq("cigGuid", location.cigGuid)
				)
				.first();
			if (!member || member.status === "invalid") {
				if (
					!(await ctx.db
						.query("locations")
						.withIndex("by_parentId", (q) => q.eq("parentId", location._id))
						.first())
				) {
					cleanupLocationId = location._id;
					break;
				}
			}
		}
		if (cleanupLocationId) {
			await ctx.db.patch("locationImportGenerations", this.input.generationId, {
				cleanupCursor: page.isDone ? null : page.continueCursor,
				cleanupLocationId
			});
			return false;
		}
		if (!page.isDone) {
			await ctx.db.patch("locationImportGenerations", this.input.generationId, {
				cleanupCursor: page.continueCursor
			});
			return false;
		}
		if (generation.cleanupDeletedInPass) {
			await ctx.db.patch("locationImportGenerations", this.input.generationId, {
				cleanupCursor: null,
				cleanupDeletedInPass: false
			});
			return false;
		}
		await ctx.db.patch("locationImportGenerations", this.input.generationId, {
			cleanupComplete: true
		});
		return true;
	}
}
