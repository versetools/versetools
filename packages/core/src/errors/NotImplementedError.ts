import type { Value } from "convex/values";

import { ResultError } from "./ResultError";

export class NotImplementedError<TContext extends Value> extends ResultError<
	"NOT_IMPLEMENTED",
	TContext
> {
	constructor(context?: TContext) {
		super("NOT_IMPLEMENTED", context);
	}
}
