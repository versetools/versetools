import type { Cursor } from "convex/server";
import * as z from "zod";

export const CursorSchema = z.string().trim().brand<Cursor>();

export const PageStatusSchema = z.enum(["SplitRecommended", "SplitRequired"]);

export function createPageSchema<T extends z.ZodType>(page: T) {
	return {
		page: page,
		isDone: z.boolean(),
		continueCursor: CursorSchema,
		splitCursor: CursorSchema.nullish(),
		pageStatus: PageStatusSchema.nullish()
	};
}
