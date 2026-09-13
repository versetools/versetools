import { vLocationType, vQuat, vWorldSpace } from "@versetools/types";
import { defineTable } from "convex/server";
import { v } from "convex/values";

import type { Doc } from "$convex/_generated/dataModel";

export type Location = Doc<"locations">;
export type LocationClosure = Doc<"locationClosures">;
export type LocationProperty = Doc<"locationProperties">;

export const locationsSchema = {
	locations: defineTable({
		cigGuid: v.string(),

		name: v.string(),
		description: v.nullable(v.string()),

		type: vLocationType,
		sourceTypeName: v.string(),
		typeCigGuid: v.nullable(v.string()),

		worldSpace: vWorldSpace,
		surface: v.boolean(),
		position: v.array(v.number()),
		rotation: v.nullable(vQuat),

		parentId: v.nullable(v.id("locations"))
	})
		.index("by_cigGuid", ["cigGuid"])
		.index("by_parentId", ["parentId"])
		.vectorIndex("by_position", {
			vectorField: "position",
			dimensions: 3,
			filterFields: ["worldSpace"]
		}),

	locationImportGenerations: defineTable({
		snapshotHash: v.string(),
		expectedBatchCount: v.number(),
		completedBatchCount: v.number(),
		cleanupComplete: v.boolean(),
		finalized: v.boolean(),
		cleanupCursor: v.union(v.string(), v.null()),
		cleanupDeletedInPass: v.boolean(),
		cleanupLocationId: v.optional(v.id("locations"))
	}),

	locationClosureRebuilds: defineTable({
		active: v.boolean(),
		generationId: v.nullable(v.id("locationImportGenerations")),
		phase: v.union(
			v.literal("awaitingCleanup"),
			v.literal("clearing"),
			v.literal("discoveringRoots"),
			v.literal("rebuilding")
		),
		rootCursor: v.union(v.string(), v.null())
	}).index("by_active", ["active"]),

	locationImportMembers: defineTable({
		generationId: v.id("locationImportGenerations"),
		cigGuid: v.string(),
		status: v.union(v.literal("valid"), v.literal("invalid"))
	})
		.index("by_generationId", ["generationId"])
		.index("by_generationId_and_cigGuid", ["generationId", "cigGuid"]),

	locationImportBatches: defineTable({
		generationId: v.id("locationImportGenerations"),
		batchNumber: v.number(),
		batchHash: v.string()
	}).index("by_generationId_and_batchNumber", ["generationId", "batchNumber"]),

	locationClosureRebuildQueue: defineTable({
		rebuildId: v.id("locationClosureRebuilds"),
		locationId: v.id("locations"),
		childrenCursor: v.union(v.string(), v.null()),
		ancestorCursor: v.union(v.string(), v.null()),
		closuresCreated: v.boolean()
	}).index("by_rebuildId", ["rebuildId"]),

	locationClosures: defineTable({
		ancestorId: v.id("locations"),
		descendantId: v.id("locations"),
		depth: v.number()
	})
		.index("by_ancestorId", ["ancestorId"])
		.index("by_descendantId", ["descendantId"])
		.index("by_ancestorId_and_descendantId", ["ancestorId", "descendantId"]),

	locationProperties: defineTable({
		locationId: v.id("locations"),
		key: v.string(),
		value: v.string()
	})
		.index("by_locationId", ["locationId"])
		.index("by_key", ["key"])
		.index("by_locationId_and_key", ["locationId", "key"])
};
