import { vEnum } from "@versetools/core/helpers";
import * as z from "zod/v4";

export enum LocationType {
	Marker = "marker",
	System = "system",
	Planet = "planet",
	Moon = "moon",
	AsteroidField = "asteroid_field",
	JumpPoint = "jump_point",
	LagrangePoint = "lagrange_point",
	Station = "station",
	CommArray = "comm_array",
	SecurityPost = "security_post",
	RaceTrack = "race_track",
	City = "city",
	Outpost = "outpost",
	Prison = "prison"
}

export const LocationTypeSchema = z.enum(LocationType);

export const vLocationType = vEnum(LocationType);

export const LocationTypeNames = {
	marker: "Marker",
	system: "System",
	planet: "Planet",
	moon: "Moon",
	asteroid_field: "Asteroid Field",
	jump_point: "Jump Point",
	lagrange_point: "Lagrange Point",
	station: "Station",
	comm_array: "Comm Array",
	security_post: "Security Post",
	race_track: "Race Track",
	city: "City",
	outpost: "Outpost",
	prison: "Prison"
} satisfies Record<LocationType, string>;

export const LocationTypeOptions = (Object.keys(LocationTypeNames) as LocationType[]).map(
	(key) => ({
		name: LocationTypeNames[key],
		value: key
	})
);
