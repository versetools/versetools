import type { DataModel } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";
import { MutationCommand } from "@versetools/core/commands";

import { FeatureFlagQuery } from "./FeatureFlagQuery";
import type { PostHogFeatureFlag } from "../../schema";

export class UpsertFeatureFlagMutation extends MutationCommand<DataModel> {
	constructor(readonly data: PostHogFeatureFlag) {
		super();
	}

	async execute(ctx: MutationCtx) {
		const flag = await this.runner.query(ctx, new FeatureFlagQuery(this.data.key));

		if (this.data.deleted) {
			if (flag) {
				await ctx.db.delete("featureFlags", flag._id);
			}
			return;
		}

		if (flag) {
			await ctx.db.patch("featureFlags", flag._id, {
				active: this.data.active,
				data: this.data,
				lastUpdatedAt: Date.now()
			});
		} else {
			await ctx.db.insert("featureFlags", {
				key: this.data.key,
				active: this.data.active,
				data: this.data,
				lastUpdatedAt: Date.now()
			});
		}
	}
}
