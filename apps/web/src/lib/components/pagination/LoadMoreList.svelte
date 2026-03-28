<script lang="ts" module>
	export type LoadMoreListProps = {
		class?: string;
		"list-class"?: string;
		pageSize: number;
		data: ReturnType<typeof usePaginatedQuery<any>>;
		children: Snippet;
	} & Omit<HTMLAttributes<HTMLElement>, "children">;
</script>

<script lang="ts">
	import { usePaginatedQuery } from "@mmailaender/convex-svelte";
	import { Button, Card } from "@versetools/ui";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import { Loader } from "$lib/components/atoms";
	import ConvexResultError from "$lib/convex/errors/ConvexResultError.svelte";

	let {
		class: className,
		"list-class": listClass,
		data,
		pageSize,
		children,
		...rest
	}: LoadMoreListProps = $props();
</script>

<div {...rest} class={twMerge("flex flex-col", className)}>
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
		<ul class={twMerge("flex flex-col gap-2", listClass)}>
			{@render children()}
			<div class="flex w-full justify-center">
				{#if data.status === "CanLoadMore"}
					<Button variant="outline" size="sm" onclick={() => data.loadMore(pageSize)}>
						Load more
					</Button>
				{:else if data.status === "LoadingMore"}
					<Loader />
				{/if}
			</div>
		</ul>
	{/if}
</div>
