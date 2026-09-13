import { MutationCommand } from "@versetools/core/commands";
import { ResultError } from "@versetools/core/errors";
import type { ReconcileLocationImportBatchSchema } from "@versetools/types";
import type * as z from "zod";

import type { DataModel } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";

import { LocationByCigGuidQuery } from "./LocationByCigGuidQuery";
import { UpdateLocationDataMutation } from "./UpdateLocationDataMutation";

export class ReconcileLocationImportBatchMutation extends MutationCommand<DataModel> {
	constructor(readonly input: z.infer<typeof ReconcileLocationImportBatchSchema>) {
		super();
	}

	async execute(ctx: MutationCtx) {
		const generation = await ctx.db.get("locationImportGenerations", this.input.generationId);
		if (!generation || generation.finalized) throw new ResultError("LOCATION_IMPORT_NOT_ACTIVE");
		if (this.input.batchNumber >= generation.expectedBatchCount)
			throw new ResultError("LOCATION_IMPORT_BATCH_OUT_OF_RANGE");
		const batch = await ctx.db
			.query("locationImportBatches")
			.withIndex("by_generationId_and_batchNumber", (q) =>
				q.eq("generationId", this.input.generationId).eq("batchNumber", this.input.batchNumber)
			)
			.unique();
		if (batch) {
			if (batch.batchHash !== this.input.batchHash)
				throw new ResultError("LOCATION_IMPORT_BATCH_HASH_MISMATCH");
			return;
		}
		for (const input of this.input.locations) {
			const existing = await this.runner.query(new LocationByCigGuidQuery(input.cigGuid));
			const parent = input.parentCigGuid
				? await this.runner.query(new LocationByCigGuidQuery(input.parentCigGuid))
				: null;
			if (input.parentCigGuid && !parent)
				throw new ResultError("LOCATION_IMPORT_PARENT_MISSING", {
					cigGuid: input.cigGuid,
					parentCigGuid: input.parentCigGuid
				});
			const parentId = parent?._id ?? null;
			if (existing) {
				await this.runner.mutation(
					new UpdateLocationDataMutation(existing, { ...input, id: existing._id })
				);
				if (existing.parentId !== parentId)
					await ctx.db.patch("locations", existing._id, { parentId });
			} else
				await ctx.db.insert("locations", {
					cigGuid: input.cigGuid,
					name: input.name,
					description: input.description,
					type: input.type,
					sourceTypeName: input.sourceTypeName,
					typeCigGuid: input.typeCigGuid,
					worldSpace: input.worldSpace,
					surface: input.surface,
					parentId,
					position: [input.position.x, input.position.y, input.position.z],
					rotation: input.rotation
				});
			await ctx.db.insert("locationImportMembers", {
				generationId: this.input.generationId,
				cigGuid: input.cigGuid,
				status: "valid"
			});
		}
		for (const cigGuid of this.input.invalidCigGuids)
			await ctx.db.insert("locationImportMembers", {
				generationId: this.input.generationId,
				cigGuid,
				status: "invalid"
			});
		await ctx.db.insert("locationImportBatches", {
			generationId: this.input.generationId,
			batchNumber: this.input.batchNumber,
			batchHash: this.input.batchHash
		});
		await ctx.db.patch("locationImportGenerations", this.input.generationId, {
			completedBatchCount: generation.completedBatchCount + 1
		});
	}
}
