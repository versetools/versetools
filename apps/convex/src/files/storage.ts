import { ok, type Ok } from "@l3dev/result";
import { zid } from "convex-helpers/server/zod4";
import * as z from "zod/v4";

import type { Id } from "$convex/_generated/dataModel";
import { CreateTemporaryFileMutation } from "$convex/app/commands/files/CreateTemporaryFileMutation";
import { secretMutation } from "$convex/app/functions";
import { runner } from "$convex/app/main";
import { FileUrls } from "$convex/app/utils/FileUrls";

export const secretCreateTemporaryFile = secretMutation({
	args: {
		key: z.string().trim(),
		sizeBytes: z.number(),
		uploaderId: zid("user"),
		expiresAt: z.number()
	},
	handler: async (ctx, args): Promise<Ok<{ fileId: Id<"files">; url: string | null }>> => {
		const fileId = await runner.mutation(ctx, new CreateTemporaryFileMutation(args));
		return ok({ fileId, url: await FileUrls.fromFileId(ctx, fileId) });
	}
});
