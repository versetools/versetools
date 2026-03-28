import { RateLimitError, ServerConfigurationError } from "@versetools/core/errors";
import { isRunMutationCtx } from "@versetools/core/helpers";

import { rateLimiter } from "$convex/components/rateLimiter";

import { CtxExtension } from "./CtxExtension";
import type { GenericCtx } from "../../dataModel";

export type RateLimitCtxInput = {
	rateLimit?: keyof NonNullable<typeof rateLimiter.limits>;
};

export class RateLimitCtxExtension<
	T extends { validSecret?: boolean } | {}
> extends CtxExtension<T> {
	constructor(private readonly input: RateLimitCtxInput) {
		super();
	}

	public async get(ctx: GenericCtx, stack: T): Promise<{}> {
		if ("validSecret" in stack && stack.validSecret) {
			return {};
		}

		if (!isRunMutationCtx(ctx)) {
			if (this.input.rateLimit) {
				throw new ServerConfigurationError({
					message: "Rate limit is only supported on mutations"
				});
			}

			return {};
		}

		if (this.input.rateLimit) {
			const limitStatus = await rateLimiter.limit(ctx, this.input.rateLimit);
			if (!limitStatus.ok) {
				throw new RateLimitError({
					retryAfter: limitStatus.retryAfter
				});
			}
		}

		return {};
	}
}
