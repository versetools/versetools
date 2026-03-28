import { MutationCommand } from "@versetools/core/commands";
import { type CreateGameLocationSchema } from "@versetools/types";
import type * as z from "zod";

import type { DataModel } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";

import { LocationAncestorsQuery } from "./LocationAncestorsQuery";

export class CreateLocationMutation extends MutationCommand<DataModel> {
	constructor(readonly input: z.infer<typeof CreateGameLocationSchema>) {
		super();
	}

	async execute(ctx: MutationCtx) {
		const locationId = await ctx.db.insert("gameLocations", {
			cryGuid: this.input.cryGuid,
			parentCryGuid: this.input.parentCryGuid,
			typeCryGuid: this.input.typeCryGuid,

			name: this.input.name,
			type: this.input.type,
			surface: this.input.surface,

			transformType: this.input.transformType,
			position: this.input.position
				? [this.input.position.x, this.input.position.y, this.input.position.z]
				: null,
			rotation: this.input.rotation
				? [
						this.input.rotation.w,
						this.input.rotation.x,
						this.input.rotation.y,
						this.input.rotation.z
					]
				: null,

			parentId: this.input.parentId ?? null
		});

		await ctx.db.insert("gameLocationClosures", {
			ancestorId: locationId,
			descendantId: locationId,
			depth: 0
		});

		if (this.input.parentId) {
			const ancestors = await this.runner.query(
				ctx,
				new LocationAncestorsQuery(this.input.parentId)
			);

			await ctx.db.insert("gameLocationClosures", {
				ancestorId: this.input.parentId,
				descendantId: locationId,
				depth: 1
			});

			for (const closure of ancestors) {
				await ctx.db.insert("gameLocationClosures", {
					ancestorId: closure.ancestorId,
					descendantId: locationId,
					depth: closure.depth + 1
				});
			}
		}

		return locationId;
	}
}
