import { ResultError } from "@versetools/core/errors";
import { v } from "convex/values";

import { env } from "$convex/_generated/server";

import { router } from "../main";

declare module "@versetools/core/routers" {
	interface RequestMetadata {
		validSecret?: boolean;
	}
}

export const secretKeyMiddleware = router
	.createMiddleware({
		args: {
			secret: v.string()
		}
	})
	.setConfig<{ secretRequired?: boolean }>()
	.withAddBindings((module, ctx, args) => {
		const { secretRequired = true } = ctx.middlewareConfig;
		const valid = args.secret === env.CONVEX_SECRET && !!env.CONVEX_SECRET;
		if (secretRequired && !valid) {
			throw new ResultError("INVALID_SECRET", {
				message: "Invalid secret"
			});
		}

		ctx.customMetadata.validSecret = valid;
		return module;
	});
