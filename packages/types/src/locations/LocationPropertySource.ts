import { vEnum } from "@versetools/core/helpers";
import * as z from "zod/v4";

export enum LocationPropertySource {
	StarMapAmenity = "starmap_amenity",
	ObjectContainer = "object_container"
}

export const LocationPropertySourceSchema = z.enum(LocationPropertySource);
export const vLocationPropertySource = vEnum(LocationPropertySource);
