<script lang="ts" module>
	type PaginatedQueryReference = FunctionReference<
		"query",
		"public",
		{
			organisationId: Id<"organisations">;
			query?: string | null;
			paginationOpts: PaginationOptions;
		},
		{
			page: any[];
		}
	>;

	export type LoadMoreSearchProps<Query extends PaginatedQueryReference> = {
		class?: string;
		"list-class"?: string;
		query: Query;
		args: Omit<WithoutOrganisationPaginationOpts<FunctionArgs<Query>>, "query">;
		defaultTake: number;
		placeholder?: string;
		onQuery?: (
			data: ReturnType<typeof useOrganisationPaginatedQuery<Query>>
		) => void | Promise<void>;
		actionsbefore?: Snippet;
		actions?: Snippet;
		children: Snippet<[{ results: PageItem<Query>[]; query?: string }]>;
	} & Omit<HTMLAttributes<HTMLElement>, "children">;
</script>

<script lang="ts" generics="Query extends PaginatedQueryReference">
	import type { Id } from "$convex/_generated/dataModel";
	import SearchIcon from "@lucide/svelte/icons/search";
	import { Input } from "@versetools/ui";
	import type { FunctionArgs, FunctionReference, PaginationOptions } from "convex/server";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import {
		useOrganisationPaginatedQuery,
		type PageItem,
		type WithoutOrganisationPaginationOpts
	} from "$lib/runes";

	import LoadMoreList from "./LoadMoreList.svelte";

	let {
		class: className,
		"list-class": listClass,
		query: queryReference,
		args: queryArgs,
		defaultTake,
		placeholder = "Search",
		onQuery,
		actionsbefore,
		actions,
		children,
		...rest
	}: LoadMoreSearchProps<Query> = $props();

	let query = $state("");

	const data = useOrganisationPaginatedQuery(
		queryReference,
		() =>
			({
				...queryArgs,
				query
			}) as WithoutOrganisationPaginationOpts<FunctionArgs<Query>>,
		{
			initialNumItems: defaultTake
		}
	);

	if (onQuery) {
		$effect(() => {
			onQuery(data);
		});
	}
</script>

<section {...rest} class={twMerge("flex w-full flex-col", className)}>
	<div class="flex gap-2">
		{@render actionsbefore?.()}
		<Input {placeholder} size="sm" class="w-full max-w-sm" bind:value={query}>
			{#snippet icon()}
				<SearchIcon class="text-text-80 size-4" />
			{/snippet}
		</Input>
		{@render actions?.()}
	</div>
	<LoadMoreList class="pt-4" list-class={listClass} {data} pageSize={defaultTake}>
		{@render children({ results: data.results, query })}
	</LoadMoreList>
</section>
