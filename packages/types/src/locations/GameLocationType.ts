import { vEnum } from "@versetools/core/helpers";
import * as z from "zod/v4";

export enum GameLocationType {
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

export const GameLocationTypeSchema = z.enum(GameLocationType);

export const vGameLocationType = vEnum(GameLocationType);

export const GameLocationTypeNames = {
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
} satisfies Record<GameLocationType, string>;

export const GameLocationTypeOptions = (
	Object.keys(GameLocationTypeNames) as GameLocationType[]
).map((key) => ({
	name: GameLocationTypeNames[key],
	value: key
}));
