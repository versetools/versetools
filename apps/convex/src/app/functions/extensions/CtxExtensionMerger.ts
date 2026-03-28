import type { Reverse } from "@versetools/core/utility-types";
import type { Expand } from "convex/server";

import type { CtxExtension, CtxExtensionValue } from "./CtxExtension";
import type { GenericCtx } from "../../dataModel";

type Merge<TExtensionsReversed> = TExtensionsReversed extends [infer T extends CtxExtension<any>]
	? CtxExtensionValue<T>
	: TExtensionsReversed extends [infer T extends CtxExtension<any>, ...infer R]
		? CtxExtensionValue<T> & Omit<Merge<R>, keyof CtxExtensionValue<T>>
		: never;

export type StackCtxExtensions<TExtensions extends CtxExtension<any>[]> =
	Merge<Reverse<TExtensions>> extends infer I extends Record<string, any> ? Expand<I> : never;

export class CtxExtensionMerger {
	static async merge<T extends CtxExtension<{}>>(
		ctx: GenericCtx,
		decorator: T
	): Promise<CtxExtensionValue<T>>;
	static async merge<
		T1 extends CtxExtension<{}>,
		T2 extends CtxExtension<StackCtxExtensions<[T1]>>
	>(ctx: GenericCtx, d1: T1, d2: T2): Promise<StackCtxExtensions<[T1, T2]>>;
	static async merge<
		T1 extends CtxExtension<{}>,
		T2 extends CtxExtension<StackCtxExtensions<[T1]>>,
		T3 extends CtxExtension<StackCtxExtensions<[T1, T2]>>
	>(ctx: GenericCtx, d1: T1, d2: T2, d3: T3): Promise<StackCtxExtensions<[T1, T2, T3]>>;
	static async merge<
		T1 extends CtxExtension<{}>,
		T2 extends CtxExtension<StackCtxExtensions<[T1]>>,
		T3 extends CtxExtension<StackCtxExtensions<[T1, T2]>>,
		T4 extends CtxExtension<StackCtxExtensions<[T1, T2, T3]>>
	>(ctx: GenericCtx, d1: T1, d2: T2, d3: T3, d4: T4): Promise<StackCtxExtensions<[T1, T2, T3, T4]>>;
	static async merge<
		T1 extends CtxExtension<{}>,
		T2 extends CtxExtension<StackCtxExtensions<[T1]>>,
		T3 extends CtxExtension<StackCtxExtensions<[T1, T2]>>,
		T4 extends CtxExtension<StackCtxExtensions<[T1, T2, T3]>>,
		T5 extends CtxExtension<StackCtxExtensions<[T1, T2, T3, T4]>>
	>(
		ctx: GenericCtx,
		d1: T1,
		d2: T2,
		d3: T3,
		d4: T4,
		d5: T5
	): Promise<StackCtxExtensions<[T1, T2, T3, T4, T5]>>;
	static async merge<
		T1 extends CtxExtension<{}>,
		T2 extends CtxExtension<StackCtxExtensions<[T1]>>,
		T3 extends CtxExtension<StackCtxExtensions<[T1, T2]>>,
		T4 extends CtxExtension<StackCtxExtensions<[T1, T2, T3]>>,
		T5 extends CtxExtension<StackCtxExtensions<[T1, T2, T3, T4]>>,
		T6 extends CtxExtension<StackCtxExtensions<[T1, T2, T3, T4, T5]>>
	>(
		ctx: GenericCtx,
		d1: T1,
		d2: T2,
		d3: T3,
		d4: T4,
		d5: T5,
		d6: T6
	): Promise<StackCtxExtensions<[T1, T2, T3, T4, T5, T6]>>;
	static async merge<
		T1 extends CtxExtension<{}>,
		T2 extends CtxExtension<StackCtxExtensions<[T1]>>,
		T3 extends CtxExtension<StackCtxExtensions<[T1, T2]>>,
		T4 extends CtxExtension<StackCtxExtensions<[T1, T2, T3]>>,
		T5 extends CtxExtension<StackCtxExtensions<[T1, T2, T3, T4]>>,
		T6 extends CtxExtension<StackCtxExtensions<[T1, T2, T3, T4, T5]>>,
		T7 extends CtxExtension<StackCtxExtensions<[T1, T2, T3, T4, T5, T6]>>
	>(
		ctx: GenericCtx,
		d1: T1,
		d2: T2,
		d3: T3,
		d4: T4,
		d5: T5,
		d6: T6,
		d7: T7
	): Promise<StackCtxExtensions<[T1, T2, T3, T4, T5, T6, T7]>>;
	static async merge<
		T1 extends CtxExtension<{}>,
		T2 extends CtxExtension<StackCtxExtensions<[T1]>>,
		T3 extends CtxExtension<StackCtxExtensions<[T1, T2]>>,
		T4 extends CtxExtension<StackCtxExtensions<[T1, T2, T3]>>,
		T5 extends CtxExtension<StackCtxExtensions<[T1, T2, T3, T4]>>,
		T6 extends CtxExtension<StackCtxExtensions<[T1, T2, T3, T4, T5]>>,
		T7 extends CtxExtension<StackCtxExtensions<[T1, T2, T3, T4, T5, T6]>>,
		T8 extends CtxExtension<StackCtxExtensions<[T1, T2, T3, T4, T5, T6, T7]>>
	>(
		ctx: GenericCtx,
		d1: T1,
		d2: T2,
		d3: T3,
		d4: T4,
		d5: T5,
		d6: T6,
		d7: T7,
		d8: T8
	): Promise<StackCtxExtensions<[T1, T2, T3, T4, T5, T6, T7, T8]>>;
	static async merge<
		T1 extends CtxExtension<{}>,
		T2 extends CtxExtension<StackCtxExtensions<[T1]>>,
		T3 extends CtxExtension<StackCtxExtensions<[T1, T2]>>,
		T4 extends CtxExtension<StackCtxExtensions<[T1, T2, T3]>>,
		T5 extends CtxExtension<StackCtxExtensions<[T1, T2, T3, T4]>>,
		T6 extends CtxExtension<StackCtxExtensions<[T1, T2, T3, T4, T5]>>,
		T7 extends CtxExtension<StackCtxExtensions<[T1, T2, T3, T4, T5, T6]>>,
		T8 extends CtxExtension<StackCtxExtensions<[T1, T2, T3, T4, T5, T6, T7]>>,
		T9 extends CtxExtension<StackCtxExtensions<[T1, T2, T3, T4, T5, T6, T7, T8]>>
	>(
		ctx: GenericCtx,
		d1: T1,
		d2: T2,
		d3: T3,
		d4: T4,
		d5: T5,
		d6: T6,
		d7: T7,
		d8: T8,
		d9: T9
	): Promise<StackCtxExtensions<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>>;

	static async merge(ctx: GenericCtx, ...extensions: CtxExtension<any>[]) {
		let stack: Record<string, any> = {};

		for (const extension of extensions) {
			stack = {
				...stack,
				...(await extension.get(ctx, stack))
			};
		}

		return stack;
	}
}
