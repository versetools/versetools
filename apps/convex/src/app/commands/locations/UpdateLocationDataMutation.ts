import { MutationCommand } from "@versetools/core/commands";
import { type UpdateLocationSchema } from "@versetools/types";
import type * as z from "zod";

import type { DataModel } from "$convex/_generated/dataModel";
import type { MutationCtx } from "$convex/_generated/server";
import type { Location } from "$convex/app/schema/locations";

export class UpdateLocationDataMutation extends MutationCommand<DataModel> {
	constructor(
		readonly location: Location,
		readonly input: z.infer<typeof UpdateLocationSchema>
	) {
		super();
	}

	async execute(ctx: MutationCtx) {
		await ctx.db.patch("locations", this.location._id, {
			cigGuid: this.input.cigGuid ?? this.location.cigGuid,

			name: this.input.name ?? this.location.name,
			description:
				this.input.description !== undefined ? this.input.description : this.location.description,

			type: this.input.type ?? this.location.type,
			sourceTypeName: this.input.sourceTypeName ?? this.location.sourceTypeName,
			typeCigGuid:
				this.input.typeCigGuid !== undefined ? this.input.typeCigGuid : this.location.typeCigGuid,

			worldSpace: this.input.worldSpace ?? this.location.worldSpace,
			surface: this.input.surface ?? this.location.surface,
			position: this.input.position
				? [this.input.position.x, this.input.position.y, this.input.position.z]
				: this.location.position,
			rotation:
				this.input.rotation === null ? null : (this.input.rotation ?? this.location.rotation)
		});
	}
}
