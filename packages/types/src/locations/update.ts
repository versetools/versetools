import { zid } from "convex-helpers/server/zod4";
import * as z from "zod/v4";

import { GameLocationTypeSchema } from "./GameLocationType";
import { GameTransformTypeSchema, QuatSchema, Vec3Schema } from "./GameTransformType";

export const UpdateGameLocationSchema = z.object({
	id: zid("gameLocations"),

	cryGuid: z.guid().optional(),
	parentCryGuid: z.guid().nullish(),
	typeCryGuid: z.guid().nullish(),

	name: z.string().trim().min(1).optional(),
	type: GameLocationTypeSchema.optional(),
	surface: z.boolean().optional(),

	transformType: GameTransformTypeSchema.nullish(),
	position: Vec3Schema.nullish(),
	rotation: QuatSchema.nullish(),

	parentId: zid("gameLocations").nullish()
});
