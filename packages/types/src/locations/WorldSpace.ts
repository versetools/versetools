import { vEnum } from "@versetools/core/helpers";
import * as z from "zod/v4";

export enum WorldSpace {
	Galactic = "galactic",
	Solar = "solar",
	Local = "local"
}

export const WorldSpaceSchema = z.enum(WorldSpace);
export const vWorldSpace = vEnum(WorldSpace);
