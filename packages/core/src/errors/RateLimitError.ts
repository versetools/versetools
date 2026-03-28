import type { Value } from "convex/values";

import { ResultError } from "./ResultError";

export type RateLimitErrorContext = {
	retryAfter: number;
	[key: string]: undefined | Value;
};

export class RateLimitError<TContext extends RateLimitErrorContext> extends ResultError<
	"EXCEEDED_RATE_LIMIT",
	TContext
> {
	constructor(context?: TContext) {
		super("EXCEEDED_RATE_LIMIT", context);
	}
}
