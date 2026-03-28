import { v } from "convex/values";
import * as z from "zod";

import { internalAction, internalQuery } from "$convex/_generated/server";
import { UpsertFeatureFlagMutation } from "$convex/app/commands/posthog/UpsertFeatureFlagMutation";
import { zInternalMutation } from "$convex/app/functions";
import { posthog, runner } from "$convex/app/main";
import type { FeatureFlag, PostHogFeatureFlag } from "$convex/app/schema";

export const getFeatureFlagsForAction = internalQuery({
	args: {
		keys: v.array(v.string())
	},
	handler: async (ctx, args): Promise<(FeatureFlag | null)[]> => {
		return posthog.getFeatureFlags(ctx, args.keys);
	}
});

export const upsertFeatureFlags = zInternalMutation({
	args: {
		flags: z.array(
			z.custom<PostHogFeatureFlag>((v): boolean => typeof v === "object", {
				error: "Expected a PostHog feature flag"
			})
		)
	},
	handler: async (ctx, args): Promise<void> => {
		for (const data of args.flags) {
			await runner.mutation(ctx, new UpsertFeatureFlagMutation(data));
		}
	}
});

export const syncFeatureFlags = internalAction({
	args: {},
	handler: async (ctx): Promise<void> => {
		await posthog.syncFeatureFlags(ctx);
	}
});
