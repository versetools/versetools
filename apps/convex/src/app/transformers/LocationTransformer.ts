import { ResultError } from "@versetools/core/errors";
import type { LocationPropertyResponse, LocationResponse } from "@versetools/types";

import type { Id } from "$convex/_generated/dataModel";
import type { LocationWithChildren } from "$convex/app/commands/locations/LocationTreeQuery";
import type { Location, LocationProperty } from "$convex/app/schema/locations";

export type PropertiesByLocationId = ReadonlyMap<Id<"locations">, LocationProperty[]>;

export class LocationTransformer {
	static groupProperties(properties: LocationProperty[]): PropertiesByLocationId {
		const result = new Map<Id<"locations">, LocationProperty[]>();
		for (const property of properties) {
			const locationProperties = result.get(property.locationId) ?? [];
			locationProperties.push(property);
			result.set(property.locationId, locationProperties);
		}
		return result;
	}

	static transform(
		location: Location | LocationWithChildren,
		propertiesByLocationId: PropertiesByLocationId
	): LocationResponse {
		if (location.position.length !== 3)
			throw new ResultError("LOCATION_POSITION_INVALID", {
				locationId: location._id,
				position: location.position
			});

		const properties = (propertiesByLocationId.get(location._id) ?? [])
			.map<LocationPropertyResponse>((property) => ({
				type: property.type,
				name: property.name,
				value: property.value
			}))
			.sort(
				(left, right) =>
					left.type.localeCompare(right.type) ||
					left.value.localeCompare(right.value) ||
					left.name.localeCompare(right.name)
			);
		const children = "children" in location ? location.children : undefined;

		return {
			_id: location._id,
			name: location.name,
			description: location.description,
			type: location.type,
			transform: {
				worldSpace: location.worldSpace,
				surface: location.surface,
				position: [location.position[0], location.position[1], location.position[2]],
				rotation: location.rotation
			},
			properties,
			...(children
				? {
						children: children.map((child) =>
							LocationTransformer.transform(child, propertiesByLocationId)
						)
					}
				: {})
		};
	}
}
