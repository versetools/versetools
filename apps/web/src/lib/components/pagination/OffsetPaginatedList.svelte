<script lang="ts" module>
	export type OffsetPaginatedListProps<T> = {
		class?: string;
		"list-class"?: string;
		"paginator-class"?: string;
		data: {
			data?: { pagination: OffsetPaginationResult<T> };
			error?: Error;
			isLoading: boolean;
			isStale: boolean;
		};
		cursor?: T | null;
		end?: boolean;
		take?: number | null;
		defaultTake: number;
		selectAll?: Snippet;
		children: Snippet;
	} & Omit<HTMLAttributes<HTMLElement>, "children">;
</script>

<script lang="ts" generics="T">
	import { Card } from "@versetools/ui";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import { Loader } from "$lib/components/atoms";
	import ConvexResultError from "$lib/convex/errors/ConvexResultError.svelte";

	import OffsetPaginator, {
		useOffsetPaginator,
		type OffsetPaginationResult
	} from "./OffsetPaginator.svelte";

	let {
		class: className,
		"list-class": listClass,
		"paginator-class": paginatorClass,
		data,
		cursor = $bindable(null),
		end = $bindable(false),
		take = $bindable(null),
		defaultTake,
		selectAll,
		children,
		...rest
	}: OffsetPaginatedListProps<T> = $props();

	const pagination = useOffsetPaginator(() => data.data?.pagination, {
		take: defaultTake
	});
</script>

<div {...rest} class={twMerge("flex flex-col", className)}>
	<div class="flex items-center gap-2 px-3 pb-2">
		{#if selectAll}
			{@render selectAll()}
			<div class="border-border ml-2 h-5 border-l-2"></div>
		{/if}
		<OffsetPaginator class={paginatorClass} {pagination} bind:cursor bind:end />
	</div>
	{#if data.isLoading}
		<div class="flex h-16 items-center justify-center">
			<Loader />
		</div>
	{:else if data.error}
		<Card variant="destructive" class="mx-auto">
			<Card.Body>
				<ConvexResultError error={data.error} />
			</Card.Body>
		</Card>
	{:else}
		<ul class={twMerge("relative flex flex-col gap-2", listClass)}>
			{@render children()}
			{#if data.isStale}
				<div class="bg-background/50 absolute inset-0 flex items-center justify-center">
					<Loader />
				</div>
			{/if}
		</ul>
	{/if}
</div>
