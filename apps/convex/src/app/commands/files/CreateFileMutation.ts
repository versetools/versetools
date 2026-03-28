import type { DataModel, Id } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";
import { MutationCommand } from "@versetools/core/commands";

export type CreateFileData = {
	key: string;
	sizeBytes: number;
	uploaderId: Id<"user">;
};

export class CreateFileMutation extends MutationCommand<DataModel> {
	constructor(readonly data: CreateFileData) {
		super();
	}

	async execute(ctx: MutationCtx) {
		const { key, sizeBytes, uploaderId } = this.data;

		return ctx.db.insert("files", {
			key,
			sizeBytes,
			uploaderId,
			awaitingAttachment: true,
			deleted: false
		});
	}
}
