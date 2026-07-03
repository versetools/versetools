import { vWorkflowId } from "@convex-dev/workflow";
import { defineTable } from "convex/server";
import { v } from "convex/values";

import type { Doc } from "$convex/_generated/dataModel";

export type File = Doc<"files">;

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
		.index("by_deletionWorkflowId", ["deletionWorkflowId"])
};
