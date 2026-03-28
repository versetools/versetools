import type { DataModel } from "$convex/_generated/dataModel";
import { vWorkflowId } from "@convex-dev/workflow";
import {
	defineTable,
	type DocumentByName,
} from "convex/server";
import {
	v
} from "convex/values";

export type File = DocumentByName<DataModel, "files">;

export const filesSchema = {
	files: defineTable({
		key: v.string(),
		sizeBytes: v.number(),
		uploaderId: v.nullable(v.id("user")),

		expiresAt: v.optional(v.nullable(v.number())),
		awaitingAttachment: v.boolean(),

		deleted: v.boolean(),
		deletionWorkflowId: v.optional(v.nullable(vWorkflowId))
	})
		.index("by_key", ["key"])
		.index("by_expiresAt", ["expiresAt"])
		.index("by_uploaderId", ["uploaderId"])
		.index("by_deletionWorkflowId", ["deletionWorkflowId"]),
};
