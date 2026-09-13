import { MutationCommand } from "@versetools/core/commands";

import type { DataModel, Id } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";

import { DeleteLocationMutation } from "./DeleteLocationMutation";

export class RemoveLocationMutation extends MutationCommand<DataModel> {
	constructor(readonly locationId: Id<"locations">) {
		super();
	}

	async execute(ctx: MutationCtx) {
		const location = await ctx.db.get("locations", this.locationId);
		if (!location) return false;
		await this.runner.mutation(new DeleteLocationMutation(location));
		return true;
	}
}
