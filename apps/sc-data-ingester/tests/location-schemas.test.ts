import {
	FindLocationsByPropertySchema,
	IngestLocationSchema,
	LocationAmenity,
	LocationPropertySource,
	LocationPropertyType,
	LocationType,
	MAX_LOCATION_PROPERTIES,
	MAX_LOCATION_PROPERTY_METADATA_LENGTH,
	MAX_LOCATION_PROPERTY_PAGE_SIZE,
	WorldSpace
} from "@versetools/types";
import { describe, expect, test } from "vitest";

const GUID = "00000000-0000-4000-8000-000000000001";

function location(properties: unknown[]) {
	return {
		cigGuid: GUID,
		parentCigGuid: null,
		name: "Location",
		nameTranslationKey: "@location_name",
		description: null,
		descriptionTranslationKey: undefined,
		type: LocationType.Planet,
		sourceTypeName: "Planet",
		typeCigGuid: GUID,
		worldSpace: WorldSpace.Solar,
		surface: false,
		position: { x: 0, y: 0, z: 0 },
		rotation: null,
		properties,
		objectContainerPropertiesComplete: true
	};
}

const clinicProperty = {
	type: LocationPropertyType.Amenity,
	value: LocationAmenity.Clinic,
	source: LocationPropertySource.StarMapAmenity,
	sourceReference: GUID,
	name: "Clinic",
	nameTranslationKey: "@clinic",
	icon: "UI/clinic.svg"
} as const;

describe("location property schemas", () => {
	test("accepts declared and object-container property provenance", () => {
		const parsed = IngestLocationSchema.parse(
			location([
				clinicProperty,
				{
					type: LocationPropertyType.Amenity,
					value: LocationAmenity.ExternalFreightElevator,
					source: LocationPropertySource.ObjectContainer,
					sourceReference: "data/objectcontainers/pu/loc/mod/common/ext_cargo/elevator.socpak",
					name: "External Freight Elevator"
				}
			])
		);

		expect(parsed.properties).toHaveLength(2);
		expect(parsed.properties[0]).toMatchObject({ value: LocationAmenity.Clinic });
	});

	test("rejects missing provenance and invalid source combinations", () => {
		expect(() =>
			IngestLocationSchema.parse(location([{ ...clinicProperty, sourceReference: undefined }]))
		).toThrow();
		expect(() =>
			IngestLocationSchema.parse(
				location([
					{
						...clinicProperty,
						value: LocationAmenity.ExternalFreightElevator
					}
				])
			)
		).toThrow();
	});

	test("rejects duplicate semantic properties and oversized arrays", () => {
		expect(() => IngestLocationSchema.parse(location([clinicProperty, clinicProperty]))).toThrow(
			"unique type and value"
		);
		expect(() =>
			IngestLocationSchema.parse(
				location(Array.from({ length: MAX_LOCATION_PROPERTIES + 1 }, () => clinicProperty))
			)
		).toThrow();
	});

	test("bounds property metadata by serialized UTF-8 bytes", () => {
		expect(
			IngestLocationSchema.safeParse(
				location([
					{
						...clinicProperty,
						name: "é".repeat(MAX_LOCATION_PROPERTY_METADATA_LENGTH)
					}
				])
			).success
		).toBe(false);
	});

	test("bounds and constrains property lookup requests", () => {
		expect(
			FindLocationsByPropertySchema.safeParse({
				type: LocationPropertyType.Amenity,
				value: LocationAmenity.Clinic,
				paginationOpts: { cursor: null, numItems: MAX_LOCATION_PROPERTY_PAGE_SIZE + 1 }
			}).success
		).toBe(false);
		expect(
			FindLocationsByPropertySchema.safeParse({
				type: LocationPropertyType.Amenity,
				value: "not-an-amenity",
				paginationOpts: { cursor: null }
			}).success
		).toBe(false);
	});

	test("accepts literal and absent location translation keys", () => {
		expect(IngestLocationSchema.parse(location([]))).toMatchObject({
			nameTranslationKey: "@location_name",
			description: null
		});
		expect(
			IngestLocationSchema.parse({
				...location([]),
				nameTranslationKey: undefined,
				description: "Literal description",
				descriptionTranslationKey: undefined
			})
		).toMatchObject({ name: "Location", description: "Literal description" });
	});

	test("preserves existing location validation", () => {
		expect(() => IngestLocationSchema.parse({ ...location([]), cigGuid: "not-a-guid" })).toThrow();
	});
});
