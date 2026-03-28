import { err, type Err } from "@l3dev/result";
import { ConvexError, type Value } from "convex/values";

import type { ForbiddenError, ForbiddenErrorContext } from "./ForbiddenError";
import type { ResultError } from "./ResultError";

export * from "./messages";
export * from "./AssertionError";
export * from "./AuthError";
export * from "./ForbiddenError";
export * from "./InternalServerError";
export * from "./InvalidSessionError";
export * from "./NotImplementedError";
export * from "./RateLimitError";
export * from "./ResultError";
export * from "./ServerConfigurationError";

export function isConvexZodError(
	error: unknown
): error is ConvexError<{ ZodError: Record<string, any>[] }> {
	return error instanceof ConvexError && "ZodError" in error.data;
}

export function isConvexResultError(error: unknown): error is ResultError<string, any> {
	return (
		error instanceof ConvexError && "type" in error.data && typeof error.data.type === "string"
	);
}

export function isConvexForbiddenError(error: unknown): error is ForbiddenError<any> {
	return isConvexResultError(error) && error.data.type === "FORBIDDEN";
}

export function isPermissionErr(
	err: Err<any, any>
): err is Err<"FORBIDDEN", ForbiddenErrorContext> {
	if (err.type !== "FORBIDDEN") {
		return false;
	}

	const context = err.context;
	if (typeof context !== "object") {
		return false;
	}

	return (
		"missingPermission" in context ||
		"missingPermissions" in context ||
		"missingOneOfPermissions" in context
	);
}

export function getResultErrorType(error: unknown) {
	if (isConvexResultError(error)) {
		return error.data.type;
	}
	return null;
}

export function resultErrorAsErr<const T extends string, TContext extends Value>(
	error: ResultError<T, TContext>
) {
	return err(error.data.type, error.data.context);
}
