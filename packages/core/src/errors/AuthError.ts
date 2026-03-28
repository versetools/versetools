import type { Value } from "convex/values";

import { ResultError } from "./ResultError";

export class AuthError<TContext extends Value> extends ResultError<"UNAUTHENTICATED", TContext> {
	constructor(context?: TContext) {
		super("UNAUTHENTICATED", context);
	}
}
