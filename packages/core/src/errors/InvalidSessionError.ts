import type { Value } from "convex/values";

import { ResultError } from "./ResultError";

export class InvalidSessionError<
	TContext extends { message: string; [key: string]: undefined | Value } = { message: string }
> extends ResultError<"INVALID_SESSION", TContext> {
	constructor(context?: TContext) {
		super("INVALID_SESSION", {
			message: "Invalid session",
			...context
		} as TContext);
	}
}
