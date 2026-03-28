import { v } from "convex/values";
import { zCustomAction, zCustomMutation, zCustomQuery } from "convex-helpers/server/zod4";

import {
	action,
	internalAction,
	internalMutation,
	internalQuery,
	mutation,
	query
} from "$convex/_generated/server";

import type { GenericCtx } from "../dataModel";
import { CtxExtensionMerger } from "./extensions/CtxExtensionMerger";
import {
	FeatureFlagsCtxExtension,
	type FeatureFlagsCtxInput
} from "./extensions/FeatureFlagsCtxExtension";
import { RateLimitCtxExtension, type RateLimitCtxInput } from "./extensions/RateLimitCtxExtension";
import { SecretCtxExtension } from "./extensions/SecretCtxExtension";

const Customization = {
	args: {
		secret: v.optional(v.string())
	},
	input: async (
		ctx: GenericCtx,
		args: { secret?: string },
		input: RateLimitCtxInput & FeatureFlagsCtxInput
	) => {
		return {
			ctx: await CtxExtensionMerger.merge(
				ctx,
				new SecretCtxExtension(args.secret, false),
				new RateLimitCtxExtension(input),
				new FeatureFlagsCtxExtension(input)
			),
			args: {}
		};
	}
};

export const zQuery = zCustomQuery(query, Customization);
export const zMutation = zCustomMutation(mutation, Customization);
export const zAction = zCustomAction(action, Customization);

const InternalCustomization = {
	args: {},
	input: async (ctx: GenericCtx, args: {}, input: RateLimitCtxInput & FeatureFlagsCtxInput) => {
		return {
			ctx: await CtxExtensionMerger.merge(ctx, new FeatureFlagsCtxExtension(input)),
			args: {}
		};
	}
};

export const zInternalQuery = zCustomQuery(internalQuery, InternalCustomization);
export const zInternalMutation = zCustomMutation(internalMutation, InternalCustomization);
export const zInternalAction = zCustomAction(internalAction, InternalCustomization);
