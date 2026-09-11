import { vLocationType, vQuat, vVec3, vWorldSpace } from "@versetools/types";
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
		typeCigGuid: v.nullable(v.string()),

		worldSpace: vWorldSpace,
		surface: v.boolean(),
		position: vVec3,
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
