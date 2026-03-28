import { api } from "$convex/_generated/api";
import type { LocationWithChildren } from "$convex/app/commands/locations/LocationTreeQuery";
import { useQuery, type UseQueryReturn } from "@mmailaender/convex-svelte";

export type LocationsQuery = UseQueryReturn<typeof api.locations.list>;

type WithParents<T> = Omit<T, "children"> & { parents?: T[]; children?: WithParents<T>[] };
export type LocationWithParentsAndChildren = WithParents<LocationWithChildren>;

function flattenAndBacklink(nodes: LocationWithChildren[]) {
	const result: LocationWithParentsAndChildren[] = [];
	const queue: LocationWithParentsAndChildren[] = [...nodes];
	while (queue.length) {
		const node = queue.shift();
		if (!node) continue;

		result.push(node);
		if (node.children) {
			queue.push(
				...node.children.map((child) => {
					child.parents = node.parents ? [...node.parents, node] : [node];
					return child;
				})
			);
		}
	}
	return result;
}

let locationsQuery: LocationsQuery | null = null;

export function useLocations() {
	locationsQuery ??= useQuery(
		api.gamedata.location.list,
		{},
		{
			keepPreviousData: true
		}
	);

	return {
		get isLoading() {
			return locationsQuery!.isLoading;
		},
		get error() {
			return locationsQuery!.error;
		},
		get all() {
			return locationsQuery?.data ? flattenAndBacklink(locationsQuery.data) : [];
		},
		search(query: string) {
			return this.all.filter((l) => l.name.toLowerCase().includes(query.toLowerCase()));
		},
		getChildren(location?: LocationWithParentsAndChildren | null) {
			if (!locationsQuery || locationsQuery.isLoading || !locationsQuery.data) {
				return [];
			}

			if (!location) {
				return locationsQuery.data;
			}

			if (location.children) {
				return location.children;
			}

			const parent = location.parents ? location.parents.at(-1) : null;
			return parent?.children ?? locationsQuery.data;
		}
	};
}
