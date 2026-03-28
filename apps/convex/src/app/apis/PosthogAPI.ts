import { internal } from "$convex/_generated/api";
import type { DataModel } from "$convex/_generated/dataModel";
import { type ActionCtx } from "$convex/_generated/server";
import { APIBase } from "@versetools/core/apis";
import type { Runner } from "@versetools/core/commands";
import { ResultError } from "@versetools/core/errors";

import { FeatureFlagsQuery } from "../commands/posthog/FeatureFlagsQuery";
import type { GenericCtx } from "../dataModel";
import type { PostHogFeatureFlag } from "../schema/posthog/featureFlag";

export type FeatureFlagCache = Record<string, boolean | null>;

export type FeatureFlagName = "allow-new-organisations" | "product-launched" | (string & {});

export type PosthogConfig = {
	projectId: string;
	apiKey: string;
};

export class PosthogAPI extends APIBase<DataModel> {
	private featureFlagsLoaded = false;
	private featureFlagsCache: FeatureFlagCache = {};

	readonly #config: PosthogConfig;

	constructor(runner: Runner<DataModel>, config: PosthogConfig) {
		super(runner);

		this.#config = config;
	}

	getFeatureFlags(ctx: GenericCtx, keys: string[]) {
		return this.runner.dynamicQuery(ctx, {
			query: new FeatureFlagsQuery(keys),
			func: internal.server.posthog.getFeatureFlagsForAction,
			args: {
				keys
			}
		});
	}

	async loadFeatureFlags(ctx: GenericCtx, keys: string[]) {
		const flags = await this.getFeatureFlags(ctx, keys);
		for (const [i, key] of keys.entries()) {
			const flag = flags[i];
			this.featureFlagsCache[key] = flag ? flag.active : null;
		}
		this.featureFlagsLoaded = true;
	}

	async isFeatureEnabled(ctx: GenericCtx, flag: FeatureFlagName) {
		if (flag in this.featureFlagsCache) {
			return this.featureFlagsCache[flag];
		}

		if (!this.featureFlagsLoaded) {
			await this.loadFeatureFlags(ctx, [flag]);
		}
		return this.featureFlagsCache![flag] ?? null;
	}

	async syncFeatureFlags(ctx: ActionCtx) {
		const url = `https://eu.posthog.com/api/projects/${this.#config.projectId}/feature_flags/local_evaluation`;

		const result = await this.safeFetch("EVALUATE_FEATURE_FLAGS", url, {
			headers: {
				Authorization: `Bearer ${this.#config.apiKey}`
			}
		});

		if (!result.ok) {
			throw ResultError.from(result);
		}

		const response = result.value;
		if (!response.ok) {
			throw new ResultError("FEATURE_FLAGS_BAD_RESPONSE", {
				response: await this.serializeResponse(response)
			});
		}

		const responseData = await response.json();
		if (!("flags" in responseData)) {
			throw new ResultError("INVALID_FEATURE_FLAGS_RESPONSE", {
				data: responseData
			});
		}

		const flags = responseData.flags as PostHogFeatureFlag[];
		await ctx.scheduler.runAfter(0, internal.server.posthog.upsertFeatureFlags, {
			flags
		});
	}
}
