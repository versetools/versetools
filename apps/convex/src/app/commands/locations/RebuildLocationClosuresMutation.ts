import { MutationCommand } from "@versetools/core/commands";
import { ResultError } from "@versetools/core/errors";

import { internal } from "$convex/_generated/api";
import type { DataModel, Id } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";

import { ActiveLocationClosureRebuildQuery } from "./ActiveLocationClosureRebuildQuery";

const CLEAR_BATCH_SIZE = 100;
const REBUILD_BATCH_SIZE = 25;

export class RebuildLocationClosuresMutation extends MutationCommand<DataModel> {
	constructor(readonly generationId: Id<"locationImportGenerations"> | null) {
		super();
	}

	async execute(ctx: MutationCtx) {
		let rebuild = await this.runner.query(new ActiveLocationClosureRebuildQuery());
		if (!rebuild) {
			if (!this.generationId) return true;
			rebuild = await ctx.db.get(
				"locationClosureRebuilds",
				await ctx.db.insert("locationClosureRebuilds", {
					active: true,
					generationId: this.generationId,
					phase: "clearing",
					rootCursor: null
				})
			);
		}
		if (!rebuild || rebuild.generationId !== this.generationId)
			throw new ResultError("LOCATION_TREE_REBUILDING");
		if (this.generationId) {
			const generation = await ctx.db.get("locationImportGenerations", this.generationId);
			if (!generation || generation.finalized || !generation.cleanupComplete)
				throw new ResultError("LOCATION_IMPORT_CLEANUP_INCOMPLETE");
		}
		if (rebuild.phase === "awaitingCleanup") {
			await ctx.db.patch("locationClosureRebuilds", rebuild._id, { phase: "clearing" });
			if (!this.generationId)
				await ctx.scheduler.runAfter(0, internal.locations.rebuildClosures, {});
			return false;
		}
		if (rebuild.phase === "clearing") {
			const closures = await ctx.db.query("locationClosures").take(CLEAR_BATCH_SIZE);
			for (const closure of closures) await ctx.db.delete("locationClosures", closure._id);
			if (closures.length > 0) {
				if (!this.generationId)
					await ctx.scheduler.runAfter(0, internal.locations.rebuildClosures, {});
				return false;
			}
			await ctx.db.patch("locationClosureRebuilds", rebuild._id, { phase: "discoveringRoots" });
			if (!this.generationId)
				await ctx.scheduler.runAfter(0, internal.locations.rebuildClosures, {});
			return false;
		}
		if (rebuild.phase === "discoveringRoots") {
			const roots = await ctx.db
				.query("locations")
				.withIndex("by_parentId", (q) => q.eq("parentId", null))
				.paginate({ cursor: rebuild.rootCursor, numItems: REBUILD_BATCH_SIZE });
			for (const root of roots.page)
				await ctx.db.insert("locationClosureRebuildQueue", {
					rebuildId: rebuild._id,
					locationId: root._id,
					childrenCursor: null,
					ancestorCursor: null,
					closuresCreated: false
				});
			await ctx.db.patch("locationClosureRebuilds", rebuild._id, {
				rootCursor: roots.isDone ? null : roots.continueCursor,
				phase: roots.isDone ? "rebuilding" : "discoveringRoots"
			});
			if (!this.generationId)
				await ctx.scheduler.runAfter(0, internal.locations.rebuildClosures, {});
			return false;
		}
		const queue = await ctx.db
			.query("locationClosureRebuildQueue")
			.withIndex("by_rebuildId", (q) => q.eq("rebuildId", rebuild._id))
			.first();
		if (!queue) {
			await ctx.db.patch("locationClosureRebuilds", rebuild._id, { active: false });
			if (this.generationId)
				await ctx.db.patch("locationImportGenerations", this.generationId, { finalized: true });
			return true;
		}
		const location = await ctx.db.get("locations", queue.locationId);
		if (!location) {
			await ctx.db.delete("locationClosureRebuildQueue", queue._id);
			if (!this.generationId)
				await ctx.scheduler.runAfter(0, internal.locations.rebuildClosures, {});
			return false;
		}
		if (!queue.closuresCreated) {
			if (!queue.ancestorCursor)
				await ctx.db.insert("locationClosures", {
					ancestorId: location._id,
					descendantId: location._id,
					depth: 0
				});
			if (location.parentId) {
				const ancestors = await ctx.db
					.query("locationClosures")
					.withIndex("by_descendantId", (q) => q.eq("descendantId", location.parentId!))
					.paginate({ cursor: queue.ancestorCursor, numItems: REBUILD_BATCH_SIZE });
				for (const ancestor of ancestors.page)
					await ctx.db.insert("locationClosures", {
						ancestorId: ancestor.ancestorId,
						descendantId: location._id,
						depth: ancestor.depth + 1
					});
				if (!ancestors.isDone) {
					await ctx.db.patch("locationClosureRebuildQueue", queue._id, {
						ancestorCursor: ancestors.continueCursor
					});
					if (!this.generationId)
						await ctx.scheduler.runAfter(0, internal.locations.rebuildClosures, {});
					return false;
				}
			}
			await ctx.db.patch("locationClosureRebuildQueue", queue._id, { closuresCreated: true });
			if (!this.generationId)
				await ctx.scheduler.runAfter(0, internal.locations.rebuildClosures, {});
			return false;
		}
		const children = await ctx.db
			.query("locations")
			.withIndex("by_parentId", (q) => q.eq("parentId", location._id))
			.paginate({ cursor: queue.childrenCursor, numItems: REBUILD_BATCH_SIZE });
		for (const child of children.page)
			await ctx.db.insert("locationClosureRebuildQueue", {
				rebuildId: rebuild._id,
				locationId: child._id,
				childrenCursor: null,
				ancestorCursor: null,
				closuresCreated: false
			});
		if (children.isDone) await ctx.db.delete("locationClosureRebuildQueue", queue._id);
		else
			await ctx.db.patch("locationClosureRebuildQueue", queue._id, {
				childrenCursor: children.continueCursor
			});
		if (!this.generationId) await ctx.scheduler.runAfter(0, internal.locations.rebuildClosures, {});
		return false;
	}
}
