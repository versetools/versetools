import { MutationCommand } from "@versetools/core/commands";
import { ResultError } from "@versetools/core/errors";
import type { AbortLocationImportSchema } from "@versetools/types";
import type * as z from "zod";

import type { DataModel } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";

import { ActiveLocationClosureRebuildQuery } from "./ActiveLocationClosureRebuildQuery";

export class AbortLocationImportMutation extends MutationCommand<DataModel> {
	constructor(readonly input: z.infer<typeof AbortLocationImportSchema>) {
		super();
	}

	async execute(ctx: MutationCtx) {
		const generation = await ctx.db.get("locationImportGenerations", this.input.generationId);
		const rebuild = await this.runner.query(new ActiveLocationClosureRebuildQuery());
		if (
			!generation ||
			generation.finalized ||
			generation.cleanupComplete ||
			generation.completedBatchCount > 0 ||
			!rebuild ||
			rebuild.generationId !== this.input.generationId ||
			rebuild.phase !== "awaitingCleanup"
		) {
			throw new ResultError("LOCATION_IMPORT_CANNOT_ABORT");
		}
		await ctx.db.delete("locationClosureRebuilds", rebuild._id);
		await ctx.db.delete("locationImportGenerations", this.input.generationId);
	}
}
