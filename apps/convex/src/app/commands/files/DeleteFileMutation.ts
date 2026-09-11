import { internal } from "$convex/_generated/api";
import type { DataModel } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";
import type { File } from "$convex/app/schema";
import { deleteFilesWorkflowManager } from "$convex/files/workflow/deleteFiles";
import { MutationCommand } from "@versetools/core/commands";

export class DeleteFileMutation extends MutationCommand<DataModel> {
	constructor(readonly file: File) {
		super();
	}

	async execute(ctx: MutationCtx) {
		return await deleteFilesWorkflowManager.start(
			ctx,
			internal.files.workflow.deleteFiles.workflow,
			{
				keys: [this.file.key],
				fileIds: [this.file._id]
			},
			{
				startAsync: true
			}
		);
	}
}
