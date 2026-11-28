/**
 * Most generic class possible.
 * Used by types to help determine if a method is a class constructor.
 *
 * Hand-written declaration (rather than declared in `src/`) because TypeScript strips the
 * parameters of private constructors when emitting declarations. The emitted
 * `private constructor();` would reject classes whose private constructor takes arguments.
 */
export declare abstract class Constructable {
	private constructor(...args: unknown[]);
}

/**
 * Almost the most generic class possible.
 *
 * @see {@link https://github.com/microsoft/TypeScript/issues/57412} why this is necessary
 *
 */
export declare abstract class ProtectedConstructable {
	protected constructor(...args: unknown[]);
}

export type Class = typeof Constructable | typeof ProtectedConstructable;
export type GenericClass<T = unknown> = new (...args: any) => T;
export type DepsClass<T, Deps extends readonly [...unknown[]]> = new (...args: Deps) => T;
export type InstanceOfClass<T extends Class> = InstanceType<(new () => never) & T>;
export type WithPrototype = { prototype: Class };

export type MaybePromise<T> = T | Promise<T>;

export type RestOrArray<T> = T[] | [T[]];

export type DeepPartial<T> = {
	[key in keyof T]?: T[key] extends
		// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
		| Function
		| PromiseLike<any>
		| ArrayLike<any>
		| Set<any>
		| Map<any, any>
		| WeakSet<any>
		| WeakMap<any, any>
		| ReadonlyArray<any>
		| ReadonlySet<any>
		| ReadonlyMap<any, any>
		? T[key]
		: T[key] extends object
			? DeepPartial<T[key]>
			: T[key];
};

/**
 * This prevents TypeScript from inferring a type as a union.
 */
export type NonUnion<T> = T extends never // `never` is the bottom type for TypeScript unions
	? never
	: T;

export type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
	x: infer R
) => any
	? R
	: never;

export type Reverse<Tuple> = Tuple extends [infer Head, ...infer Tail]
	? [...Reverse<Tail>, Head]
	: [];

export type ObjectMerge<Tuple> = Tuple extends [infer T]
	? T
	: Tuple extends [infer T, ...infer R]
		? T & Omit<ObjectMerge<R>, keyof T>
		: never;
