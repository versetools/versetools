import { vEnum } from "@versetools/core/helpers";
import * as z from "zod/v4";

export enum LocationPropertyType {
	Amenity = "amenity"
}

export const LocationPropertyTypeSchema = z.enum(LocationPropertyType);
export const vLocationPropertyType = vEnum(LocationPropertyType);
