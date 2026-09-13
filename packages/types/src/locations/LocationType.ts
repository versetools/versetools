import { vEnum } from "@versetools/core/helpers";
import * as z from "zod/v4";

export enum LocationType {
	System = "system",
	Star = "star",
	Planet = "planet",
	Moon = "moon",
	Asteroid = "asteroid",
	Anomaly = "anomaly",
	CardinalPoint = "cardinal_point",
	JumpPoint = "jump_point",
	Outpost = "outpost",
	LandingZone = "landing_zone",
	NavPoint = "nav_point",
	PointOfInterest = "point_of_interest",
	Manmade = "manmade",
	QuantumTracePoint = "quantum_trace_point",
	YouAreHere = "you_are_here"
}

export const LocationTypeSchema = z.enum(LocationType);

export const vLocationType = vEnum(LocationType);

export const LocationTypeNames = {
	system: "System",
	star: "Star",
	planet: "Planet",
	moon: "Moon",
	asteroid: "Asteroid",
	anomaly: "Anomaly",
	cardinal_point: "Cardinal Point",
	jump_point: "Jump Point",
	outpost: "Outpost",
	landing_zone: "Landing Zone",
	nav_point: "Navigation Point",
	point_of_interest: "Point of Interest",
	manmade: "Manmade",
	quantum_trace_point: "Quantum Trace Point",
	you_are_here: "You Are Here"
} satisfies Record<LocationType, string>;

export const LocationTypeOptions = (Object.keys(LocationTypeNames) as LocationType[]).map(
	(key) => ({
		name: LocationTypeNames[key],
		value: key
	})
);
