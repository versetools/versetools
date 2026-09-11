import { MutationCommand } from "@versetools/core/commands";
import { type CreateLocationSchema } from "@versetools/types";
import type * as z from "zod";

import type { DataModel } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";

import { LocationAncestorsQuery } from "./LocationAncestorsQuery";

export class CreateLocationMutation extends MutationCommand<DataModel> {
	constructor(readonly input: z.infer<typeof CreateLocationSchema>) {
		super();
	}

	async execute(ctx: MutationCtx) {
		const locationId = await ctx.db.insert("locations", {
			cigGuid: this.input.cigGuid,

			name: this.input.name,
			description: this.input.description,

			type: this.input.type,
			typeCigGuid: this.input.typeCigGuid,

			worldSpace: this.input.worldSpace,
			surface: this.input.surface,
			position: [this.input.position.x, this.input.position.y, this.input.position.z],
			rotation: this.input.rotation,

			parentId: this.input.parentId ?? null
		});

		await ctx.db.insert("locationClosures", {
			ancestorId: locationId,
			descendantId: locationId,
			depth: 0
		});

		if (this.input.parentId) {
			const ancestors = await this.runner.query(new LocationAncestorsQuery(this.input.parentId));

			await ctx.db.insert("locationClosures", {
				ancestorId: this.input.parentId,
				descendantId: locationId,
				depth: 1
			});

			for (const closure of ancestors) {
				await ctx.db.insert("locationClosures", {
					ancestorId: closure.ancestorId,
					descendantId: locationId,
					depth: closure.depth + 1
				});
			}
		}

		return locationId;
	}
}
