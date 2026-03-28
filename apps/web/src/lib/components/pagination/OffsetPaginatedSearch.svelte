<script lang="ts" module>
	type OffsetPaginatedQueryReference = FunctionReference<
		"query",
		"public",
		{
			organisationId: Id<"organisations">;
			query?: string | null;
			cursor?: any | null;
			end?: boolean | null;
			take?: number | null;
		},
		{ pagination: OffsetPaginationResult<any> }
	>;

	export type OffsetPaginatedSearchProps<Query extends OffsetPaginatedQueryReference> = {
		class?: string;
		"list-class"?: string;
		query: Query;
		defaultTake: number;
		onQuery?: (data: UseQueryReturn<Query>) => void | Promise<void>;
		actions?: Snippet;
		selectAll?: Snippet<[{ data: FunctionReturnType<Query> | undefined }]>;
		children: Snippet<[{ data: FunctionReturnType<Query>; query?: string }]>;
	} & Omit<HTMLAttributes<HTMLElement>, "children">;
</script>

<script lang="ts" generics="Query extends OffsetPaginatedQueryReference">
	import type { Id } from "$convex/_generated/dataModel";
	import SearchIcon from "@lucide/svelte/icons/search";
	import type { UseQueryReturn } from "@mmailaender/convex-svelte";
	import { Input } from "@versetools/ui";
	import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import { useOrganisationQuery, type WithoutOrganisationId } from "$lib/runes";

	import OffsetPaginatedList from "./OffsetPaginatedList.svelte";
	import { useOffsetPaginationState, type OffsetPaginationResult } from "./OffsetPaginator.svelte";

	let {
		class: className,
		"list-class": listClass,
		query: queryReference,
		defaultTake,
		onQuery,
		actions,
		selectAll: selectAllInner,
		children,
		...rest
	}: OffsetPaginatedSearchProps<Query> = $props();

	const paginationState = useOffsetPaginationState<Id<"organisationPolicies">>({
		take: {
			default: defaultTake,
			options: [defaultTake]
		}
	});

	const data = useOrganisationQuery(
		queryReference,
		() => paginationState as WithoutOrganisationId<FunctionArgs<Query>>,
		{
			keepPreviousData: true
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
		<Input
			placeholder="Search"
			size="sm"
			class="w-full max-w-sm"
			bind:value={paginationState.query}
		>
			{#snippet icon()}
				<SearchIcon class="text-text-80 size-4" />
			{/snippet}
		</Input>
		{@render actions?.()}
	</div>
	{#snippet selectAll()}
		{@render selectAllInner?.({ data: data.data })}
	{/snippet}
	<OffsetPaginatedList
		class="pt-4"
		list-class={listClass}
		{data}
		{defaultTake}
		bind:cursor={paginationState.cursor}
		bind:end={paginationState.end}
		bind:take={paginationState.take}
		selectAll={selectAllInner ? selectAll : undefined}
	>
		{#if data.data}
			{@render children({ data: data.data, query: paginationState.query })}
		{/if}
	</OffsetPaginatedList>
</section>
