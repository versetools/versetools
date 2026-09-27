import { MutationCommand } from "@versetools/core/commands";
import { ResultError } from "@versetools/core/errors";
import type { BeginLocationImportSchema } from "@versetools/types";
import type * as z from "zod";

import type { DataModel } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";

import { ActiveLocationClosureRebuildQuery } from "./ActiveLocationClosureRebuildQuery";

export class BeginLocationImportMutation extends MutationCommand<DataModel> {
	constructor(readonly input: z.infer<typeof BeginLocationImportSchema>) {
		super();
	}

	async execute(ctx: MutationCtx) {
		const rebuilding = await this.runner.query(new ActiveLocationClosureRebuildQuery());
		if (rebuilding) {
			if (
				rebuilding.generationId &&
				(await ctx.db.get("locationImportGenerations", rebuilding.generationId))?.snapshotHash ===
					this.input.snapshotHash
			) {
				return rebuilding.generationId;
			}
			throw new ResultError("LOCATION_TREE_REBUILDING");
		}
		const generationId = await ctx.db.insert("locationImportGenerations", {
			snapshotHash: this.input.snapshotHash,
			expectedBatchCount: this.input.expectedBatchCount,
			completedBatchCount: 0,
			cleanupComplete: false,
			finalized: false,
			cleanupCursor: null,
			cleanupDeletedInPass: false
		});
		await ctx.db.insert("locationClosureRebuilds", {
			active: true,
			generationId,
			phase: "awaitingCleanup",
			rootCursor: null
		});
		return generationId;
	}
}
