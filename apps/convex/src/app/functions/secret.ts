import { v, type ObjectType } from "convex/values";
import { zCustomAction, zCustomMutation, zCustomQuery } from "convex-helpers/server/zod4";

import { action, mutation, query } from "$convex/_generated/server";

import type { GenericCtx } from "../dataModel";
import { CtxExtensionMerger } from "./extensions/CtxExtensionMerger";
import {
	FeatureFlagsCtxExtension,
	type FeatureFlagsCtxInput
} from "./extensions/FeatureFlagsCtxExtension";
import { RateLimitCtxExtension, type RateLimitCtxInput } from "./extensions/RateLimitCtxExtension";
import { SecretCtxExtension } from "./extensions/SecretCtxExtension";

export const SecretArgs = {
	secret: v.string()
};

const Customization = {
	args: SecretArgs,
	input: async (
		ctx: GenericCtx,
		args: ObjectType<typeof SecretArgs>,
		input: RateLimitCtxInput & FeatureFlagsCtxInput & AsUserCtxInput
	) => {
		return {
			ctx: await CtxExtensionMerger.merge(
				ctx,
				new SecretCtxExtension(args.secret),
				new RateLimitCtxExtension(input),
				new FeatureFlagsCtxExtension(input)
			),
			args: {}
		};
	}
};

export const secretQuery = zCustomQuery(query, Customization);
export const secretMutation = zCustomMutation(mutation, Customization);
export const secretAction = zCustomAction(action, Customization);
