import type { MaybePromise } from "@versetools/core/utility-types";
import type { Expand } from "convex/server";

import type { GenericCtx } from "../../dataModel";

export type CtxExtensionValue<TExtension extends CtxExtension<any>> =
	Awaited<ReturnType<TExtension["get"]>> extends infer T extends Record<string, any>
		? Expand<T>
		: never;

export abstract class CtxExtension<TStack> {
	public abstract get(ctx: GenericCtx, stack: TStack): MaybePromise<Record<string, any>>;
}
