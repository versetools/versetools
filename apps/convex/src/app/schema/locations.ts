import { vGameLocationType, vGameTransformType } from "@versetools/types";
import { defineTable } from "convex/server";
import { v } from "convex/values";

import type { Doc } from "$convex/_generated/dataModel";

export type Location = Doc<"locations">;
export type LocationClosure = Doc<"locationClosures">;

export const locationsSchema = {
	locations: defineTable({
		cryGuid: v.string(),
		parentCryGuid: v.nullable(v.string()),
		typeCryGuid: v.nullable(v.string()),

		name: v.string(),
		type: vGameLocationType,
		surface: v.boolean(),

		transformType: v.nullable(vGameTransformType),
		position: v.nullable(v.array(v.number())),
		rotation: v.nullable(v.array(v.number())),

		parentId: v.nullable(v.id("locations"))
	})
		.index("by_parentId", ["parentId"])
		.vectorIndex("by_position", {
			vectorField: "position",
			dimensions: 3,
			filterFields: ["transformType"]
		}),

	locationClosures: defineTable({
		ancestorId: v.id("locations"),
		descendantId: v.id("locations"),
		depth: v.number()
	})
		.index("by_ancestorId", ["ancestorId"])
		.index("by_descendantId", ["descendantId"])
		.index("by_ancestorId_and_descendantId", ["ancestorId", "descendantId"])
};
