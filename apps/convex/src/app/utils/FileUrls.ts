import type { Id } from "$convex/_generated/dataModel";

import type { QueryableCtx } from "../dataModel";

export class FileUrls {
	static fromKey(key: string) {
		return `https://${process.env.UPLOADTHING_APP_ID}.ufs.sh/f/${key}`;
	}

	static async fromFileId(ctx: QueryableCtx, fileId: Id<"files">) {
		const file = await ctx.db.get("files", fileId);
		return file ? this.fromKey(file.key) : null;
	}
}
