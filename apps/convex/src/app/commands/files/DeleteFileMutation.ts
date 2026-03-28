import { internal } from "$convex/_generated/api";
import type { DataModel } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";
import { deleteFilesWorkflowManager } from "$convex/files/workflow/deleteFiles";
import { MutationCommand } from "@versetools/core/commands";

import type { File, OrganisationFileAttachment } from "../../../schema";

export class DeleteFileMutation extends MutationCommand<DataModel> {
	constructor(
		readonly file: File
	) {
		super();
	}

	async execute(ctx: MutationCtx) {
		return await deleteFilesWorkflowManager.start(
			ctx,
			internal.files.workflow.deleteFiles.workflow,
			{
				keys: [this.file.key],
				fileIds: [this.file._id],
			},
			{
				startAsync: true
			}
		);
	}
}
