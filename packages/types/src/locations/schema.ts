import { zid } from "convex-helpers/server/zod4";
import * as z from "zod/v4";

import { LocationTypeSchema } from "./LocationType";
import { WorldSpaceSchema } from "./WorldSpace";
import { v } from "convex/values";

export const Vec3Schema = z.object({
	x: z.number(),
	y: z.number(),
	z: z.number()
});
export const vVec3 = v.object({
	x: v.number(),
	y: v.number(),
	z: v.number()
});

export const QuatSchema = z.object({
	w: z.number(),
	x: z.number(),
	y: z.number(),
	z: z.number()
});
export const vQuat = v.object({
	w: v.number(),
	x: v.number(),
	y: v.number(),
	z: v.number()
});

export const CreateLocationSchema = z.object({
	cigGuid: z.guid(),

	name: z.string().trim().min(1),
	description: z.string().trim().nullable(),

	type: LocationTypeSchema,
	typeCigGuid: z.guid().nullable(),

	worldSpace: WorldSpaceSchema,
	surface: z.boolean(),
	position: Vec3Schema,
	rotation: QuatSchema.nullable(),

	parentId: zid("locations").nullish()
});

export const UpdateLocationSchema = z.object({
	id: zid("locations"),
	cigGuid: z.guid().optional(),

	name: z.string().trim().min(1).optional(),
	description: z.string().trim().nullish(),

	type: LocationTypeSchema.optional(),
	typeCigGuid: z.guid().nullish(),

	worldSpace: WorldSpaceSchema.optional(),
	surface: z.boolean().optional(),
	position: Vec3Schema.optional(),
	rotation: QuatSchema.nullish(),

	parentId: zid("locations").nullish()
});
