import type { DataModel, Id } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";
import type { WorkflowId } from "@convex-dev/workflow";
import { MutationCommand } from "@versetools/core/commands";
import { asyncMap } from "convex-helpers";

export class TagFilesForDeletionMutation extends MutationCommand<DataModel> {
	constructor(
		readonly workflowId: WorkflowId,
		readonly fileIds: Id<"files">[]
	) {
		super();
	}

	async execute(ctx: MutationCtx) {
		await asyncMap(this.fileIds, (id) =>
			ctx.db.patch("files", id, {
				deleted: true,
				deletionWorkflowId: this.workflowId
			})
		);
	}
}
