import { ResultError } from "@versetools/core/errors";
import { v } from "convex/values";

import { env } from "$convex/_generated/server";

import { router } from "../main";

declare module "@versetools/core/routers" {
	interface RequestMetadata {
		validSecret?: boolean;
	}
}

export function secretKeyMiddleware({ required = true } = {}) {
	return router.createMiddleware({
		args: {
			secret: v.string()
		},
		handler(factory, ctx, args) {
			const valid = args.secret === env.CONVEX_SECRET && !!env.CONVEX_SECRET;
			if (required && !valid) {
				throw new ResultError("INVALID_SECRET", {
					message: "Invalid secret"
				});
			}

			ctx.customMetadata.validSecret = valid;

			return factory;
		}
	});
}
