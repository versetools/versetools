import { zid } from "convex-helpers/server/zod4";
import * as z from "zod/v4";

import { GameLocationTypeSchema } from "./GameLocationType";
import { GameTransformTypeSchema, QuatSchema, Vec3Schema } from "./GameTransformType";

export const CreateGameLocationSchema = z.object({
	cryGuid: z.guid(),
	parentCryGuid: z.guid().nullable(),
	typeCryGuid: z.guid().nullable(),

	name: z.string().trim().min(1),
	type: GameLocationTypeSchema,
	surface: z.boolean(),

	transformType: GameTransformTypeSchema.nullable(),
	position: Vec3Schema.nullable(),
	rotation: QuatSchema.nullable(),

	parentId: zid("gameLocations").nullish()
});
