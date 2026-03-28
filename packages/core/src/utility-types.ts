export type WithPrototype = { prototype: Class };
export type Class = (abstract new (...args: any) => any) & { prototype: any };

export type MaybePromise<T> = T | Promise<T>;

export type RestOrArray<T> = T[] | [T[]];

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
