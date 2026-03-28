import type { Value } from "convex/values";

import { ResultError } from "./ResultError";

export type ForbiddenErrorContext = {
	missingPermission?: string;
	missingPermissions?: string[];
	missingOneOfPermissions?: string[];
	[key: string]: undefined | Value;
};

export class ForbiddenError<TContext extends ForbiddenErrorContext> extends ResultError<
	"FORBIDDEN",
	TContext
> {
	constructor(context?: TContext) {
		super("FORBIDDEN", context);
	}
}
