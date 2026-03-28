import type { UnionToIntersection } from "@versetools/core/utility-types";
import { type GenericSchema } from "convex/server";

import { actionsCacheSchema } from "./cache/actions";
import { filesSchema } from "./files/files";
import { gameLocationsSchema } from "./gameLocations";
import { featureFlagsSchema } from "./posthog/featureFlag";

export type * from "./cache/actions";
export type * from "./files/files";
export type * from "./posthog/featureFlag";

export function mergeSchema<T extends GenericSchema>(schemas: T[]) {
	return schemas.reduce((acc, schema) => ({ ...acc, ...schema }), {}) as UnionToIntersection<T>;
}

export const schema = mergeSchema([
	actionsCacheSchema,
	featureFlagsSchema,

	filesSchema,

	gameLocationsSchema
]);
