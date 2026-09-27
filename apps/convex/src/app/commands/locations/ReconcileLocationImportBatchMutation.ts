import { MutationCommand } from "@versetools/core/commands";
import { ResultError } from "@versetools/core/errors";
import {
	LocationPropertySource,
	type IngestLocationPropertySchema,
	type ReconcileLocationImportBatchSchema
} from "@versetools/types";
import type * as z from "zod";

import type { DataModel } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";
import type { LocationProperty } from "$convex/app/schema/locations";

import { LocationByCigGuidQuery } from "./LocationByCigGuidQuery";
import { UpdateLocationDataMutation } from "./UpdateLocationDataMutation";

type IngestLocationProperty = z.infer<typeof IngestLocationPropertySchema>;

const propertyIdentity = (property: Pick<LocationProperty, "type" | "value">) =>
	`${property.type}\0${property.value}`;

const propertyMetadata = (property: IngestLocationProperty) => ({
	sourceReference: property.sourceReference,
	name: property.name,
	nameTranslationKey: "nameTranslationKey" in property ? property.nameTranslationKey : undefined,
	icon: "icon" in property ? property.icon : undefined
});

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
			let locationId;
			if (existing) {
				locationId = existing._id;
				await this.runner.mutation(
					new UpdateLocationDataMutation(existing, { ...input, id: existing._id })
				);
				if (existing.parentId !== parentId)
					await ctx.db.patch("locations", existing._id, { parentId });
			} else
				locationId = await ctx.db.insert("locations", {
					cigGuid: input.cigGuid,
					name: input.name,
					nameTranslationKey: input.nameTranslationKey,
					description: input.description,
					descriptionTranslationKey: input.descriptionTranslationKey,
					type: input.type,
					sourceTypeName: input.sourceTypeName,
					typeCigGuid: input.typeCigGuid,
					worldSpace: input.worldSpace,
					surface: input.surface,
					parentId,
					position: [input.position.x, input.position.y, input.position.z],
					rotation: input.rotation
				});
			await this.reconcileProperties(
				ctx,
				locationId,
				input.properties,
				input.objectContainerPropertiesComplete
			);
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

	private async reconcileProperties(
		ctx: MutationCtx,
		locationId: LocationProperty["locationId"],
		desiredProperties: IngestLocationProperty[],
		objectContainerPropertiesComplete: boolean
	) {
		const existingProperties = await ctx.db
			.query("locationProperties")
			.withIndex("by_locationId", (q) => q.eq("locationId", locationId))
			.collect();
		const allExistingByIdentity = new Map<string, LocationProperty>();
		for (const property of existingProperties) {
			const identity = propertyIdentity(property);
			if (allExistingByIdentity.has(identity)) {
				throw new ResultError("DUPLICATE_LOCATION_PROPERTY", {
					locationId,
					type: property.type,
					value: property.value
				});
			}
			allExistingByIdentity.set(identity, property);
		}

		for (const source of Object.values(LocationPropertySource)) {
			const existingByIdentity = new Map<string, LocationProperty>();
			for (const property of existingProperties.filter((property) => property.source === source)) {
				const identity = propertyIdentity(property);
				existingByIdentity.set(identity, property);
			}

			for (const desired of desiredProperties.filter((property) => property.source === source)) {
				const identity = propertyIdentity(desired);
				const existingProperty = existingByIdentity.get(identity);
				const metadata = propertyMetadata(desired);
				if (existingProperty) {
					if (
						existingProperty.sourceReference !== metadata.sourceReference ||
						existingProperty.name !== metadata.name ||
						existingProperty.nameTranslationKey !== metadata.nameTranslationKey ||
						existingProperty.icon !== metadata.icon
					)
						await ctx.db.patch("locationProperties", existingProperty._id, metadata);
					existingByIdentity.delete(identity);
				} else {
					const ownedByAnotherSource = allExistingByIdentity.get(identity);
					if (ownedByAnotherSource)
						throw new ResultError("DUPLICATE_LOCATION_PROPERTY", {
							locationId,
							type: desired.type,
							value: desired.value
						});
					await ctx.db.insert("locationProperties", {
						locationId,
						type: desired.type,
						value: desired.value,
						source,
						...metadata
					});
				}
			}

			if (source === LocationPropertySource.StarMapAmenity || objectContainerPropertiesComplete)
				for (const property of existingByIdentity.values())
					await ctx.db.delete("locationProperties", property._id);
		}
	}
}
