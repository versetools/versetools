import { ok, type Ok } from "@l3dev/result";

import type { Id } from "$convex/_generated/dataModel";
import { CreateTemporaryFileMutation } from "$convex/app/commands/files/CreateTemporaryFileMutation";
import { router } from "$convex/app/main";
import { v } from "convex/values";
import { secretKeyMiddleware } from "$convex/app/middleware/secretKeyMiddleware";
import FileStorageService from "@versetools/core/services/files/FileStorageService";

export const secretCreateTemporaryFile = router
	.withMiddleware(secretKeyMiddleware())
	.mutation({
		args: {
			key: v.string(),
			sizeBytes: v.number(),
			expiresAt: v.number()
		}
	})
	.withDependencies(({ ctxId, runnerId, argsId }) => [ctxId, runnerId, argsId, FileStorageService])
	.withHandler(
		async (
			ctx,
			runner,
			args,
			fileService
		): Promise<Ok<{ fileId: Id<"files">; url: string | null }>> => {
			const fileId = await runner.mutation(new CreateTemporaryFileMutation(args));
			const file = await ctx.db.get("files", fileId);
			return ok({ fileId, url: file ? fileService.urlFromKey(file.key) : null });
		}
	);
