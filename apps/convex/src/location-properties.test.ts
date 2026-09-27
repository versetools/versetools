import type { QueryCommand, QueryValue } from "@versetools/core/commands";
import { RunnerService } from "@versetools/core/services/commands/RunnerService";
import { SubscriptionRegistry } from "@versetools/core/services/commands/subscriptions/SubscriptionRegistry";
import {
	FindLocationsByPropertySchema,
	LocationAmenity,
	LocationPropertySource,
	LocationPropertyType,
	LocationType,
	MAX_LOCATION_PROPERTY_METADATA_LENGTH,
	MAX_LOCATION_TREE_PROPERTIES,
	MAX_LOCATION_TREE_PROPERTY_READ_BYTES,
	MAX_LOCATION_TREE_PROPERTY_ROW_BYTES,
	WorldSpace
} from "@versetools/types";
import { convexTest, type TestConvexForDataModel } from "convex-test";
import { expect, test } from "vitest";

import type { DataModel, Id } from "$convex/_generated/dataModel";
import { AllLocationPropertiesQuery } from "$convex/app/commands/locations/AllLocationPropertiesQuery";
import { LocationsByPropertyQuery } from "$convex/app/commands/locations/LocationsByPropertyQuery";
import { LocationsListQuery } from "$convex/app/commands/locations/LocationsListQuery";
import { LocationTransformer } from "$convex/app/transformers/LocationTransformer";

import schema from "./schema";
import { modules } from "./test.setup";

const runQuery = async <Command extends QueryCommand<DataModel>>(
	t: TestConvexForDataModel<DataModel>,
	command: Command
): Promise<QueryValue<Command>> =>
	await t.query(async (ctx) => {
		const runner = new RunnerService(ctx, new SubscriptionRegistry<DataModel>());
		return await runner.query(command);
	});

async function insertLocationWithProperties(
	t: TestConvexForDataModel<DataModel>,
	name: string,
	values: LocationAmenity[],
	parentId: Id<"locations"> | null = null
) {
	return await t.run(async (ctx) => {
		const locationId = await ctx.db.insert("locations", {
			cigGuid: crypto.randomUUID(),
			name,
			description: null,
			type: LocationType.PointOfInterest,
			sourceTypeName: "TestLocation",
			typeCigGuid: null,
			worldSpace: WorldSpace.Local,
			surface: false,
			position: [0, 0, 0],
			rotation: null,
			parentId
		});
		for (const value of values)
			await ctx.db.insert("locationProperties", {
				locationId,
				type: LocationPropertyType.Amenity,
				value,
				name: value.replaceAll("_", " "),
				nameTranslationKey: `@${value}`,
				source: LocationPropertySource.StarMapAmenity,
				sourceReference: crypto.randomUUID(),
				icon: `UI/${value}.svg`
			});
		return locationId;
	});
}

test("transforms a recursive location tree without persistence metadata", async () => {
	const t = convexTest(schema, modules);
	const rootId = await insertLocationWithProperties(t, "Root", [
		LocationAmenity.Docking,
		LocationAmenity.Clinic
	]);
	const childId = await insertLocationWithProperties(t, "Child", [], rootId);

	const transformed = await t.run(async (ctx) => {
		const root = (await ctx.db.get("locations", rootId))!;
		const child = (await ctx.db.get("locations", childId))!;
		const properties = await ctx.db.query("locationProperties").collect();
		return LocationTransformer.transform(
			{ ...root, children: [child] },
			LocationTransformer.groupProperties(properties)
		);
	});

	expect(transformed).toEqual({
		_id: rootId,
		name: "Root",
		description: null,
		type: LocationType.PointOfInterest,
		transform: {
			worldSpace: WorldSpace.Local,
			surface: false,
			position: [0, 0, 0],
			rotation: null
		},
		properties: [
			{ type: LocationPropertyType.Amenity, name: "clinic", value: LocationAmenity.Clinic },
			{ type: LocationPropertyType.Amenity, name: "docking", value: LocationAmenity.Docking }
		],
		children: [
			{
				_id: childId,
				name: "Child",
				description: null,
				type: LocationType.PointOfInterest,
				transform: {
					worldSpace: WorldSpace.Local,
					surface: false,
					position: [0, 0, 0],
					rotation: null
				},
				properties: []
			}
		]
	});
	expect(transformed).not.toHaveProperty("cigGuid");
	expect(transformed.properties[0]).not.toHaveProperty("sourceReference");
	expect(transformed.properties[0]).not.toHaveProperty("nameTranslationKey");
});

test("lists transformed trees with one complete property read", async () => {
	const t = convexTest(schema, modules);
	const rootId = await insertLocationWithProperties(t, "Root", [LocationAmenity.Clinic]);
	const childId = await insertLocationWithProperties(
		t,
		"Child",
		[LocationAmenity.Docking, LocationAmenity.Hospital],
		rootId
	);
	await t.run(async (ctx) => {
		await ctx.db.insert("locationClosures", {
			ancestorId: rootId,
			descendantId: rootId,
			depth: 0
		});
		await ctx.db.insert("locationClosures", {
			ancestorId: rootId,
			descendantId: childId,
			depth: 1
		});
		await ctx.db.insert("locationClosures", {
			ancestorId: childId,
			descendantId: childId,
			depth: 0
		});
	});

	const locations = await runQuery(t, new LocationsListQuery());

	expect(locations).toHaveLength(1);
	expect(locations[0]).toMatchObject({
		_id: rootId,
		properties: [{ value: LocationAmenity.Clinic }],
		children: [
			{
				_id: childId,
				properties: [{ value: LocationAmenity.Docking }, { value: LocationAmenity.Hospital }]
			}
		]
	});
});

test("rejects malformed location positions", async () => {
	const t = convexTest(schema, modules);
	const locationId = await insertLocationWithProperties(t, "Malformed", []);
	const location = await t.run(async (ctx) => {
		await ctx.db.patch("locations", locationId, { position: [0, 0] });
		return (await ctx.db.get("locations", locationId))!;
	});

	expect(() => LocationTransformer.transform(location, new Map())).toThrow();
});

test("bounds complete-tree property reads", async () => {
	const t = convexTest(schema, modules);
	await insertLocationWithProperties(t, "First", [LocationAmenity.Clinic]);
	await insertLocationWithProperties(t, "Second", [LocationAmenity.Docking]);
	await insertLocationWithProperties(t, "Third", [LocationAmenity.Hospital]);

	expect(await runQuery(t, new AllLocationPropertiesQuery(3))).toHaveLength(3);
	await expect(runQuery(t, new AllLocationPropertiesQuery(2))).rejects.toMatchObject({
		data: { type: "LOCATION_PROPERTY_READ_LIMIT_EXCEEDED" }
	});
});

test("reserves complete-tree read headroom from maximum serialized property rows", () => {
	const metadata = "x".repeat(MAX_LOCATION_PROPERTY_METADATA_LENGTH);
	const maximumProperty = {
		_id: "j".repeat(32),
		_creationTime: 9_999_999_999_999,
		locationId: "j".repeat(32),
		type: LocationPropertyType.Amenity,
		value: LocationAmenity.ExternalFreightElevator,
		name: metadata,
		nameTranslationKey: metadata,
		source: LocationPropertySource.StarMapAmenity,
		sourceReference: metadata,
		icon: metadata
	};
	const serializedBytes = new TextEncoder().encode(JSON.stringify(maximumProperty)).byteLength;

	expect(serializedBytes).toBeLessThanOrEqual(MAX_LOCATION_TREE_PROPERTY_ROW_BYTES);
	expect(MAX_LOCATION_TREE_PROPERTIES * MAX_LOCATION_TREE_PROPERTY_ROW_BYTES).toBeLessThanOrEqual(
		MAX_LOCATION_TREE_PROPERTY_READ_BYTES
	);
	expect(16 * 1024 * 1024 - MAX_LOCATION_TREE_PROPERTY_READ_BYTES).toBe(6 * 1024 * 1024);
});

test("paginates exact property matches as transformed locations", async () => {
	const t = convexTest(schema, modules);
	await insertLocationWithProperties(t, "First", [LocationAmenity.Clinic, LocationAmenity.Docking]);
	await insertLocationWithProperties(t, "Second", [LocationAmenity.Clinic]);
	await insertLocationWithProperties(t, "Other", [LocationAmenity.Docking]);

	const first = await runQuery(
		t,
		new LocationsByPropertyQuery({
			type: LocationPropertyType.Amenity,
			value: LocationAmenity.Clinic,
			paginationOpts: { cursor: null, numItems: 1 }
		})
	);
	const second = await runQuery(
		t,
		new LocationsByPropertyQuery({
			type: LocationPropertyType.Amenity,
			value: LocationAmenity.Clinic,
			paginationOpts: { cursor: first.continueCursor, numItems: 1 }
		})
	);

	expect(first.page).toHaveLength(1);
	expect(second.page).toHaveLength(1);
	expect(first.page[0]._id).not.toBe(second.page[0]._id);
	expect(
		[...first.page, ...second.page].every((location) =>
			location.properties.some(({ value }) => value === LocationAmenity.Clinic)
		)
	).toBe(true);
	const locationWithMultipleProperties = [...first.page, ...second.page].find(
		({ name }) => name === "First"
	);
	expect(locationWithMultipleProperties?.properties.map(({ value }) => value)).toEqual([
		LocationAmenity.Clinic,
		LocationAmenity.Docking
	]);
	expect(first.page[0]).not.toHaveProperty("cigGuid");
	expect(first.page[0].properties[0]).not.toHaveProperty("source");
});

test("returns empty searches and validates pagination bounds", async () => {
	const t = convexTest(schema, modules);
	const result = await runQuery(
		t,
		new LocationsByPropertyQuery({
			type: LocationPropertyType.Amenity,
			value: LocationAmenity.Clinic,
			paginationOpts: { cursor: null }
		})
	);

	expect(result.page).toEqual([]);
	expect(
		FindLocationsByPropertySchema.safeParse({
			type: LocationPropertyType.Amenity,
			value: LocationAmenity.Clinic,
			paginationOpts: { cursor: null, numItems: 101 }
		}).success
	).toBe(false);
});

test("rejects property searches while the location tree is rebuilding", async () => {
	const t = convexTest(schema, modules);
	await t.run(
		async (ctx) =>
			await ctx.db.insert("locationClosureRebuilds", {
				active: true,
				generationId: null,
				phase: "clearing",
				rootCursor: null
			})
	);

	await expect(
		runQuery(
			t,
			new LocationsByPropertyQuery({
				type: LocationPropertyType.Amenity,
				value: LocationAmenity.Clinic,
				paginationOpts: { cursor: null }
			})
		)
	).rejects.toMatchObject({ data: { type: "LOCATION_TREE_REBUILDING" } });
	await expect(runQuery(t, new LocationsListQuery())).rejects.toMatchObject({
		data: { type: "LOCATION_TREE_REBUILDING" }
	});
});
