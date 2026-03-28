import type { DataModel } from "$convex/_generated/dataModel";
import { defineTable, type DocumentByName } from "convex/server";
import { v, type VAny } from "convex/values";

export type FlagProperty = {
	key: string;
	type?: string;
	value: FlagPropertyValue;
	operator?: string;
	negation?: boolean;
	dependency_chain?: string[];
};

export type FlagPropertyValue = string | number | (string | number)[] | boolean;

export type FeatureFlagCondition = {
	properties: FlagProperty[];
	rollout_percentage?: number;
	variant?: string;
};

export type PostHogFeatureFlag = {
	id: number;
	name: string;
	key: string;
	filters?: {
		aggregation_group_type_index?: number;
		groups?: FeatureFlagCondition[];
		multivariate?: {
			variants: {
				key: string;
				rollout_percentage: number;
			}[];
		};
		payloads?: Record<string, string>;
	};
	deleted: boolean;
	active: boolean;
	rollout_percentage: null | number;
	ensure_experience_continuity: boolean;
	experiment_set: number[];
};

export type FeatureFlag = DocumentByName<DataModel, "featureFlags">;

export const featureFlagsSchema = {
	featureFlags: defineTable({
		key: v.string(),
		active: v.boolean(),
		data: v.any() as VAny<PostHogFeatureFlag>,
		lastUpdatedAt: v.number()
	}).index("by_key", ["key"])
};
