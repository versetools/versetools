import { defineTable } from "convex/server";
import { v } from "convex/values";

import type { Doc } from "$convex/_generated/dataModel";

export type CachedActionValue = Doc<"cachedActionValues">;
export type CachedActionMetadata = Doc<"cachedActionMetadata">;

export const actionCacheSchema = {
	cachedActionValues: defineTable({
		name: v.string(),
		args: v.any(),
		value: v.any(),
		metadataId: v.optional(v.id("cachedActionMetadata"))
	}).index("by_key", ["name", "args"]),

	cachedActionMetadata: defineTable({
		valueId: v.id("cachedActionValues"),
		expiresAt: v.number()
	}).index("by_expiresAt", ["expiresAt"])
};
