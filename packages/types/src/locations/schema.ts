import { v, type GenericId } from "convex/values";
import { zid } from "convex-helpers/server/zod4";
import * as z from "zod/v4";

import { LocationAmenity, LocationAmenitySchema, vLocationAmenity } from "./LocationAmenity";
import { LocationPropertySource, LocationPropertySourceSchema } from "./LocationPropertySource";
import { LocationPropertyTypeSchema, vLocationPropertyType } from "./LocationPropertyType";
import { LocationTypeSchema, vLocationType } from "./LocationType";
import { vWorldSpace, WorldSpaceSchema } from "./WorldSpace";

export const MAX_LOCATION_IMPORT_BATCH_SIZE = 25;
export const MAX_LOCATION_PROPERTIES = 26;
// A maximum persisted property with 512-byte metadata fields serializes below 2.5 KiB. Reserving
// 10 MiB of Convex's 16 MiB transaction read budget supports 4,000 properties and leaves 6 MiB for
// the roughly 2,000 location documents and their closure rows in a complete-tree read.
export const MAX_LOCATION_TREE_PROPERTY_ROW_BYTES = 2_500;
export const MAX_LOCATION_TREE_PROPERTY_READ_BYTES = 10 * 1024 * 1024;
export const MAX_LOCATION_TREE_PROPERTIES = 4_000;
export const MAX_LOCATION_PROPERTY_PAGE_SIZE = 100;
export const MAX_LOCATION_PROPERTY_REFERENCE_LENGTH = 512;
export const MAX_LOCATION_PROPERTY_METADATA_LENGTH = 512;

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

const LocationPropertyReferenceSchema = z
	.string()
	.trim()
	.min(1)
	.max(MAX_LOCATION_PROPERTY_REFERENCE_LENGTH)
	.refine(
		(value) => new TextEncoder().encode(value).byteLength <= MAX_LOCATION_PROPERTY_REFERENCE_LENGTH,
		`Location property references must not exceed ${MAX_LOCATION_PROPERTY_REFERENCE_LENGTH} UTF-8 bytes`
	);
const LocationPropertyMetadataSchema = z
	.string()
	.trim()
	.min(1)
	.max(MAX_LOCATION_PROPERTY_METADATA_LENGTH)
	.refine(
		(value) => new TextEncoder().encode(value).byteLength <= MAX_LOCATION_PROPERTY_METADATA_LENGTH,
		`Location property metadata must not exceed ${MAX_LOCATION_PROPERTY_METADATA_LENGTH} UTF-8 bytes`
	);

export const StarMapAmenityPropertySchema = z.object({
	type: LocationPropertyTypeSchema,
	value: LocationAmenitySchema.exclude(["ExternalFreightElevator"]),
	source: z.literal(LocationPropertySource.StarMapAmenity),
	sourceReference: z.guid(),
	name: LocationPropertyMetadataSchema,
	nameTranslationKey: LocationPropertyMetadataSchema.optional(),
	icon: LocationPropertyMetadataSchema
});

export const ObjectContainerPropertySchema = z.object({
	type: LocationPropertyTypeSchema,
	value: z.literal(LocationAmenity.ExternalFreightElevator),
	source: z.literal(LocationPropertySource.ObjectContainer),
	sourceReference: LocationPropertyReferenceSchema,
	name: LocationPropertyMetadataSchema
});

export const IngestLocationPropertySchema = z.discriminatedUnion("source", [
	StarMapAmenityPropertySchema,
	ObjectContainerPropertySchema
]);

export const LocationPropertySchema = z.object({
	locationId: zid("locations"),
	type: LocationPropertyTypeSchema,
	value: LocationAmenitySchema,
	name: LocationPropertyMetadataSchema,
	nameTranslationKey: LocationPropertyMetadataSchema.optional(),
	source: LocationPropertySourceSchema.optional(),
	sourceReference: LocationPropertyReferenceSchema.optional(),
	icon: LocationPropertyMetadataSchema.optional()
});

export const LocationPropertyResponseSchema = z.object({
	type: LocationPropertyTypeSchema,
	name: LocationPropertyMetadataSchema,
	value: LocationAmenitySchema
});

export const vLocationPropertyResponse = v.object({
	type: vLocationPropertyType,
	name: v.string(),
	value: vLocationAmenity
});

export type LocationPropertyResponse = z.infer<typeof LocationPropertyResponseSchema>;

export type LocationResponse = {
	_id: GenericId<"locations">;
	name: string;
	description: string | null;
	type: z.infer<typeof LocationTypeSchema>;
	transform: {
		worldSpace: z.infer<typeof WorldSpaceSchema>;
		surface: boolean;
		position: [number, number, number];
		rotation: z.infer<typeof QuatSchema> | null;
	};
	properties: LocationPropertyResponse[];
	children?: LocationResponse[];
};

export const LocationResponseSchema = z.object({
	_id: zid("locations"),
	name: z.string().trim(),
	description: z.string().trim().nullable(),
	type: LocationTypeSchema,
	transform: z.object({
		worldSpace: WorldSpaceSchema,
		surface: z.boolean(),
		position: z.tuple([z.number(), z.number(), z.number()]),
		rotation: QuatSchema.nullable()
	}),
	properties: LocationPropertyResponseSchema.array(),
	children: z.array(z.unknown()).optional()
});

export const vLocationResponse = v.object({
	_id: v.id("locations"),
	name: v.string(),
	description: v.nullable(v.string()),
	type: vLocationType,
	transform: v.object({
		worldSpace: vWorldSpace,
		surface: v.boolean(),
		position: v.array(v.number()),
		rotation: v.nullable(vQuat)
	}),
	properties: v.array(vLocationPropertyResponse),
	children: v.array(v.any()).optional()
});

export const CreateLocationSchema = z.object({
	cigGuid: z.guid(),

	name: z.string().trim().min(1),
	nameTranslationKey: LocationPropertyMetadataSchema.optional(),
	description: z.string().trim().nullable(),
	descriptionTranslationKey: LocationPropertyMetadataSchema.optional(),

	type: LocationTypeSchema,
	sourceTypeName: z.string().trim().min(1),
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
	nameTranslationKey: LocationPropertyMetadataSchema.nullish(),
	description: z.string().trim().nullish(),
	descriptionTranslationKey: LocationPropertyMetadataSchema.nullish(),

	type: LocationTypeSchema.optional(),
	sourceTypeName: z.string().trim().min(1).optional(),
	typeCigGuid: z.guid().nullish(),

	worldSpace: WorldSpaceSchema.optional(),
	surface: z.boolean().optional(),
	position: Vec3Schema.optional(),
	rotation: QuatSchema.nullish(),

	parentId: zid("locations").nullish()
});

export const IngestLocationSchema = CreateLocationSchema.omit({ parentId: true })
	.extend({
		parentCigGuid: z.guid().nullable(),
		properties: z.array(IngestLocationPropertySchema).max(MAX_LOCATION_PROPERTIES),
		objectContainerPropertiesComplete: z.boolean()
	})
	.superRefine((location, ctx) => {
		const identities = new Set<string>();

		for (const [index, property] of location.properties.entries()) {
			const identity = `${property.type}\0${property.value}`;
			if (identities.has(identity)) {
				ctx.addIssue({
					code: "custom",
					message: "Location properties must have unique type and value combinations",
					path: ["properties", index]
				});
			}
			identities.add(identity);
		}
	});

export const BeginLocationImportSchema = z.object({
	snapshotHash: z
		.string()
		.trim()
		.regex(/^[a-f0-9]{64}$/),
	expectedBatchCount: z.int().positive().max(10_000)
});

export const ReconcileLocationImportBatchSchema = z
	.object({
		generationId: zid("locationImportGenerations"),
		batchNumber: z.int().nonnegative(),
		batchHash: z
			.string()
			.trim()
			.regex(/^[a-f0-9]{64}$/),
		locations: z.array(IngestLocationSchema).max(MAX_LOCATION_IMPORT_BATCH_SIZE),
		invalidCigGuids: z.array(z.guid()).max(250)
	})
	.refine((batch) => batch.locations.length > 0 || batch.invalidCigGuids.length > 0, {
		error: "A location import batch must include locations or invalid GUIDs"
	});

export const FinalizeLocationImportSchema = z.object({
	generationId: zid("locationImportGenerations")
});

export const AbortLocationImportSchema = z.object({
	generationId: zid("locationImportGenerations")
});

const LocationPropertyPaginationSchema = z.object({
	cursor: z.string().trim().nullable(),
	numItems: z.int().positive().max(MAX_LOCATION_PROPERTY_PAGE_SIZE).optional()
});

export const FindLocationsByPropertySchema = z.object({
	type: LocationPropertyTypeSchema,
	value: LocationAmenitySchema,
	paginationOpts: LocationPropertyPaginationSchema
});
