import { MutationCommand } from "@versetools/core/commands";

import type { DataModel, Id } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";

export class MakeFilePermanentMutation extends MutationCommand<DataModel> {
	constructor(readonly fileId: Id<"files">) {
		super();
	}

	async execute(ctx: MutationCtx) {
		await ctx.db.patch("files", this.fileId, {
			expiresAt: null
		});
	}
}
