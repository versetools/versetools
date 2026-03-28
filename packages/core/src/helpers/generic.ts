import type { Expand } from "convex/server";
import { asyncMap, type BetterOmit } from "convex-helpers";

export type ReplaceValues<T, Keys extends (keyof T)[], Value> = BetterOmit<T, Keys[number]> & {
	[K in Keys[number]]: Value | Exclude<T[K], NonNullable<T[K]>>;
};

export function replaceValues<T extends Record<string, any>, Keys extends (keyof T)[], Value>(
	obj: T,
	keys: Keys,
	value: Value
) {
	return Object.fromEntries(
		Object.entries(obj).map(([k, v]) =>
			keys.includes(k as Keys[number]) ? [k, v === null || v === undefined ? v : value] : [k, v]
		)
	) as Expand<ReplaceValues<T, Keys, Value>>;
}

export async function asyncFilter<T>(
	arr: T[],
	predicate: (item: T, index: number) => Promise<boolean>
) {
	const predicateResults = await asyncMap(arr, async (item, index) => {
		return [item, await predicate(item, index)] as [T, boolean];
	});

	return predicateResults.filter(([, result]) => result).map(([item]) => item);
}

export function diff<Prev extends unknown[], Next extends unknown[], SharedId>(
	prev: {
		data: Prev;
		sharedId: (item: Prev[number]) => SharedId;
	},
	next: {
		data: Next;
		sharedId: (item: Next[number]) => NoInfer<SharedId>;
	}
) {
	const prevIdCache = new Map<Prev[number], SharedId>();
	const nextIdCache = new Map<Next[number], SharedId>();

	const prevIds = new Set(
		prev.data.map((item) => {
			const id = prev.sharedId(item);
			prevIdCache.set(item, id);
			return id;
		})
	);
	const nextIds = new Set(
		next.data.map((item) => {
			const id = next.sharedId(item);
			nextIdCache.set(item, id);
			return id;
		})
	);

	return {
		added: next.data.filter((item) => !prevIds.has(nextIdCache.get(item)!)) as Next,
		removed: prev.data.filter((item) => !nextIds.has(prevIdCache.get(item)!)) as Prev
	};
}
