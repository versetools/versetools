import { MutationCommand } from "@versetools/core/commands";
import { type UpdateGameLocationSchema } from "@versetools/types";
import type * as z from "zod";

import type { DataModel } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";
import type { GameLocation } from "$convex/app/schema/gameLocations";

export class UpdateLocationDataMutation extends MutationCommand<DataModel> {
	constructor(
		readonly location: GameLocation,
		readonly input: z.infer<typeof UpdateGameLocationSchema>
	) {
		super();
	}

	async execute(ctx: MutationCtx) {
		await ctx.db.patch("gameLocations", this.location._id, {
			cryGuid: this.input.cryGuid ?? this.location.cryGuid,
			parentCryGuid:
				this.input.parentCryGuid !== undefined
					? this.input.parentCryGuid
					: this.location.parentCryGuid,
			typeCryGuid:
				this.input.typeCryGuid !== undefined ? this.input.typeCryGuid : this.location.typeCryGuid,

			name: this.input.name ?? this.location.name,
			type: this.input.type ?? this.location.type,
			surface: this.input.surface ?? this.location.surface,

			transformType:
				this.input.transformType !== undefined
					? this.input.transformType
					: this.location.transformType,
			position: this.input.position
				? [this.input.position.x, this.input.position.y, this.input.position.z]
				: this.input.position === null
					? null
					: this.location.position,
			rotation: this.input.rotation
				? [
						this.input.rotation.w,
						this.input.rotation.x,
						this.input.rotation.y,
						this.input.rotation.z
					]
				: this.input.rotation === null
					? null
					: this.location.rotation
		});
	}
}
