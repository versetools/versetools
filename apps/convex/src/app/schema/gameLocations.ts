import { vGameLocationType, vGameTransformType } from "@versetools/types";
import { defineTable } from "convex/server";
import { v } from "convex/values";

import type { Doc } from "$convex/_generated/dataModel";

export type GameLocation = Doc<"gameLocations">;
export type GameLocationClosure = Doc<"gameLocationClosures">;

export const gameLocationsSchema = {
	gameLocations: defineTable({
		cryGuid: v.string(),
		parentCryGuid: v.nullable(v.string()),
		typeCryGuid: v.nullable(v.string()),

		name: v.string(),
		type: vGameLocationType,
		surface: v.boolean(),

		transformType: v.nullable(vGameTransformType),
		position: v.nullable(v.array(v.number())),
		rotation: v.nullable(v.array(v.number())),

		parentId: v.nullable(v.id("gameLocations"))
	})
		.index("by_parentId", ["parentId"])
		.vectorIndex("by_position", {
			vectorField: "position",
			dimensions: 3,
			filterFields: ["transformType"]
		}),

	gameLocationClosures: defineTable({
		ancestorId: v.id("gameLocations"),
		descendantId: v.id("gameLocations"),
		depth: v.number()
	})
		.index("by_ancestorId", ["ancestorId"])
		.index("by_descendantId", ["descendantId"])
		.index("by_ancestorId_and_descendantId", ["ancestorId", "descendantId"])
};
