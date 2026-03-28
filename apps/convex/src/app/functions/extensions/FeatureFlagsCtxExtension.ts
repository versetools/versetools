import { ResultError } from "@versetools/core/errors";

import { posthog } from "$convex/app/main";

import { CtxExtension } from "./CtxExtension";
import type { FeatureFlagName } from "../../apis";
import type { GenericCtx } from "../../dataModel";

export type FeatureFlagsCtxInput = {
	featureFlag?: FeatureFlagName;
};

export class FeatureFlagsCtxExtension<T> extends CtxExtension<T> {
	constructor(private readonly input: FeatureFlagsCtxInput) {
		super();
	}

	public async get(
		ctx: GenericCtx,
		_stack: T
	): Promise<{
		preloadFeatureFlags: (keys: string[]) => Promise<void>;
		isFeatureEnabled: (key: string) => Promise<boolean>;
	}> {
		await this.checkFeatureFlag(ctx);

		return {
			async preloadFeatureFlags(keys: string[]) {
				await posthog.loadFeatureFlags(ctx, keys);
			},
			async isFeatureEnabled(key: string) {
				return (await posthog.isFeatureEnabled(ctx, key)) ?? false;
			}
		};
	}

	async checkFeatureFlag(ctx: GenericCtx) {
		if (!this.input.featureFlag) {
			return;
		}

		const enabled = await posthog.isFeatureEnabled(ctx, this.input.featureFlag);
		if (!enabled) {
			throw new ResultError("FEATURE_DISABLED", {
				flag: this.input.featureFlag
			});
		}
	}
}
