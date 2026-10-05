import type { DefaultFunctionArgs } from "convex/server";
import { identifier, type HaywireId } from "haywire";

import type { GenericCtx } from "../../helpers";
import type { RequestMetadata } from "../types";

export type CtxId<Ctx extends GenericCtx<any>> = HaywireId<
	Ctx & { customMetadata: RequestMetadata },
	null,
	null,
	false,
	false,
	false,
	false,
	false
>;

export type ArgsId<ArgsObject extends DefaultFunctionArgs = DefaultFunctionArgs> = HaywireId<
	ArgsObject,
	null,
	null,
	false,
	false,
	false,
	false,
	false
>;

export const genericCtxId = identifier<GenericCtx<any>>().named("convex-ctx");
export const genericArgsId = identifier<object>().named("convex-args");
