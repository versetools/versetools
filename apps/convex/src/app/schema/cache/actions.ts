import type { DataModel } from "$convex/_generated/dataModel";
import { defineTable, type DocumentByName } from "convex/server";
import { v } from "convex/values";

export type FormField = DocumentByName<DataModel, "formFields">;
export type FormFieldInput = DocumentByName<DataModel, "formFieldInputs">;

export const actionsCacheSchema = {
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
