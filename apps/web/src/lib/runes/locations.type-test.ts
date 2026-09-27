import { api } from "$convex/_generated/api";
import type { LocationPropertyResponse, LocationResponse } from "@versetools/types";
import type { FunctionReturnType } from "convex/server";

type Equal<Left, Right> =
	(<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2
		? true
		: false;
type Assert<Value extends true> = Value;

type ListResult = FunctionReturnType<typeof api.locations.list>;
type ListedLocation = ListResult[number];
type ListedProperty = ListedLocation["properties"][number];

type PrivateLocationField =
	| "_creationTime"
	| "parentId"
	| "cigGuid"
	| "sourceTypeName"
	| "typeCigGuid"
	| "nameTranslationKey"
	| "descriptionTranslationKey"
	| "worldSpace"
	| "surface"
	| "position"
	| "rotation";
type PrivatePropertyField =
	| "_id"
	| "_creationTime"
	| "locationId"
	| "nameTranslationKey"
	| "source"
	| "sourceReference"
	| "icon";

type _ListUsesSharedResponse = Assert<Equal<ListResult, LocationResponse[]>>;
type _ListExposesGroupedTransform = Assert<
	Equal<ListedLocation["transform"], LocationResponse["transform"]>
>;
type _ListExposesTypedProperties = Assert<Equal<ListedProperty, LocationPropertyResponse>>;
type _ListPreservesRecursiveChildren = Assert<
	Equal<NonNullable<ListedLocation["children"]>[number], LocationResponse>
>;
type _ListOmitsPrivateLocationFields = Assert<
	Equal<Extract<keyof ListedLocation, PrivateLocationField>, never>
>;
type _ListOmitsPrivatePropertyFields = Assert<
	Equal<Extract<keyof ListedProperty, PrivatePropertyField>, never>
>;
