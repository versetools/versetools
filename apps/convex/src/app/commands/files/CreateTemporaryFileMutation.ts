import type { DataModel } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";
import { MutationCommand } from "@versetools/core/commands";

export class CreateTemporaryFileMutation extends MutationCommand<DataModel> {
	constructor(
		readonly data: {
			key: string;
			sizeBytes: number;
			expiresAt: number;
		}
	) {
		super();
	}

	async execute(ctx: MutationCtx) {
		const { key, sizeBytes, expiresAt } = this.data;

		return ctx.db.insert("files", {
			key,
			sizeBytes,
			expiresAt,
			awaitingAttachment: true,
			deleted: false
		});
	}
}
