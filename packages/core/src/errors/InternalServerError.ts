import type { Value } from "convex/values";

import { ResultError } from "./ResultError";

export class InternalServerError<TContext extends Value> extends ResultError<
	"INTERNAL_SERVER_ERROR",
	TContext
> {
	constructor(context?: TContext) {
		super("INTERNAL_SERVER_ERROR", context);
	}
}
