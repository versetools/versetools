import { vEnum } from "@versetools/core/helpers";
import * as z from "zod/v4";

export enum GameTransformType {
	Galactic = "galactic",
	Solar = "solar",
	Relative = "relative"
}

export const GameTransformTypeSchema = z.enum(GameTransformType);

export const vGameTransformType = vEnum(GameTransformType);

export const Vec3Schema = z.object({
	x: z.number(),
	y: z.number(),
	z: z.number()
});

export const QuatSchema = z.object({
	w: z.number(),
	x: z.number(),
	y: z.number(),
	z: z.number()
});
