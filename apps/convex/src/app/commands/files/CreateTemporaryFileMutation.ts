import type { DataModel, Id } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";
import { MutationCommand } from "@versetools/core/commands";

export class CreateTemporaryFileMutation extends MutationCommand<DataModel> {
	constructor(
		readonly data: {
			key: string;
			sizeBytes: number;
			expiresAt: number;
			uploaderId: Id<"user">;
		}
	) {
		super();
	}

	async execute(ctx: MutationCtx) {
		const { key, sizeBytes, expiresAt, uploaderId } = this.data;

		return ctx.db.insert("files", {
			key,
			sizeBytes,
			uploaderId,
			expiresAt,
			awaitingAttachment: true,
			deleted: false
		});
	}
}
