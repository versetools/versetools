import type { Err } from "@l3dev/result";

import type { ForbiddenErrorContext } from "../ForbiddenError";
import type { RateLimitErrorContext } from "../RateLimitError";

export type MessageData = { title: string; description: string };

export const defaultMessages: Record<string, MessageData | ((err: Err<any, any>) => MessageData)> =
	{
		ASSERTION: {
			title: "Server-side assertion failed",
			description: "Please contact support immediately."
		},
		INVALID_STAR_CITIZEN_HANDLE: {
			title: "Invalid Star Citizen handle",
			description: "The handle you entered is invalid, please double check it and try again."
		},
		EXPIRED_TOKEN: {
			title: "Token has expired",
			description: "The provided token has expired, please generate a new one."
		},
		MISSING_PERMISSION: (err: Err<"FORBIDDEN", ForbiddenErrorContext>) => {
			let description = "";
			if ("missingPermissions" in err.context && err.context.missingPermissions) {
				description =
					"Requires the following permissions: " + err.context.missingPermissions.join(", ");
			} else if ("missingOneOfPermissions" in err.context && err.context.missingOneOfPermissions) {
				description =
					"Requires one of the following permissions: " +
					err.context.missingOneOfPermissions.join(", ");
			} else {
				description = "Requires permission: " + err.context.missingPermission;
			}

			return {
				title: "You do not have permission to do that",
				description
			};
		},
		EXCEEDED_RATE_LIMIT: (err: Err<"EXCEEDED_RATE_LIMIT", RateLimitErrorContext>) => {
			const retryAfterSeconds = Math.ceil(err.context.retryAfter / 1000);

			return {
				title: "You have exceeded the rate limit",
				description: `Please wait ${retryAfterSeconds} second${retryAfterSeconds === 1 ? "" : "s"} before trying again.`
			};
		},
		FEATURE_DISABLED: {
			title: "Feature is disabled",
			description: "This feature is currently disabled."
		},
		CAPTCHA_FAILED: {
			title: "Captcha failed",
			description: "Failed to verify captcha, please try again."
		}
	};
