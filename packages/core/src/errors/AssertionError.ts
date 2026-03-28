import type { Value } from "convex/values";

import { ResultError } from "./ResultError";

export class AssertionError<TContext extends Value> extends ResultError<"ASSERTION", TContext> {
	constructor(context?: TContext) {
		console.error("ASSERTION ERROR:", context);
		super("ASSERTION", context);
	}
}

export function assert(condition: unknown, message?: string): asserts condition {
	if (!condition) {
		throw new AssertionError({
			message
		});
	}
}
