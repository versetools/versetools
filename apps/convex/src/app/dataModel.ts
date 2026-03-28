import type {
	GenericQueryableCtx,
	GenericCtx as GenericGenericCtx
} from "@versetools/core/helpers";

import type { DataModel } from "$convex/_generated/dataModel";

export type QueryableCtx = GenericQueryableCtx<DataModel>;
export type GenericCtx = GenericGenericCtx<DataModel>;
