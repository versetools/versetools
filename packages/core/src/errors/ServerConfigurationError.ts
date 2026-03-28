import type { Value } from "convex/values";

import { ResultError } from "./ResultError";

export class ServerConfigurationError<TContext extends Value> extends ResultError<
	"SERVER_CONFIGURATION_ERROR",
	TContext
> {
	constructor(context?: TContext) {
		super("SERVER_CONFIGURATION_ERROR", context);
	}
}
