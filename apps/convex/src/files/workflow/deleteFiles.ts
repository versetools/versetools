import { vWorkflowId, WorkflowManager } from "@convex-dev/workflow";
import { v } from "convex/values";
import { pruneNull } from "convex-helpers";
import { getAll } from "convex-helpers/server/relationships";

import { components, internal } from "$convex/_generated/api";
import { internalMutation } from "$convex/_generated/server";
import { DeleteEntryFileMutation } from "$convex/app/commands/files/DeleteEntryFileMutation";
import { TagFilesForDeletionMutation } from "$convex/app/commands/files/TagFilesForDeletionMutation";
import { runner } from "$convex/app/main";

export const deleteFilesWorkflowManager = new WorkflowManager(components.workflow, {
	workpoolOptions: {
		retryActionsByDefault: true,
		maxParallelism: 20,
		defaultRetryBehavior: {
			base: 3,
			initialBackoffMs: 2000,
			maxAttempts: 4
		}
	}
});

export const workflow = deleteFilesWorkflowManager.define({
	args: {
		keys: v.array(v.string()),
		fileIds: v.array(v.id("files"))
	},
	handler: async (step, args): Promise<void> => {
		console.log(`[DeleteFilesWorkflow] Tagging ${args.fileIds.length} files for deletion...`);
		await step.runMutation(internal.files.workflow.deleteFiles.tagFiles, {
			workflowId: step.workflowId,
			fileIds: args.fileIds
		});

		console.log(`[DeleteFilesWorkflow] Deleting ${args.fileIds.length} files from storage...`);
		await step.runAction(internal.server.fileStorage.deleteFiles, {
			keys: args.keys
		});

		console.log(`[DeleteFilesWorkflow] Deleting ${args.fileIds.length} file entries...`);
		await step.runMutation(internal.files.workflow.deleteFiles.deleteFiles, {
			fileIds: args.fileIds
		});
	}
});

export const tagFiles = internalMutation({
	args: {
		workflowId: vWorkflowId,
		fileIds: v.array(v.id("files"))
	},
	handler: async (ctx, args): Promise<void> => {
		await runner.mutation(ctx, new TagFilesForDeletionMutation(args.workflowId, args.fileIds));
	}
});

export const deleteFiles = internalMutation({
	args: {
		fileIds: v.array(v.id("files"))
	},
	handler: async (ctx, args): Promise<void> => {
		const files = pruneNull(await getAll(ctx.db, args.fileIds));
		await runner.mapMutation(ctx, files, (file) => new DeleteEntryFileMutation(file));
	}
});
