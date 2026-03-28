import type { DataModel } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";
import { MutationCommand } from "@versetools/core/commands";
import type { DocumentByName } from "convex/server";

import type { File } from "../../schema";

export class DeleteEntryFileMutation extends MutationCommand<DataModel> {
	constructor(
		readonly file: File,
	) {
		super();
	}

	async execute(ctx: MutationCtx) {
		await ctx.db.delete("files", this.file._id);
	}
}
