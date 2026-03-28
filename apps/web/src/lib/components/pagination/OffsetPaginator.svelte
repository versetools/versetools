<script lang="ts" module>
	export type UseOffsetPaginationStateOptions<Cursor, Take> = {
		initialQuery?: string;
		initialCursor?: Cursor | "end" | null;
		take: {
			default: Take;
			options: Take[];
		};
	};

	export function useOffsetPaginationState<Cursor, Take extends number = number>(
		options: UseOffsetPaginationStateOptions<Cursor, Take>
	) {
		let query = $state(options.initialQuery ?? "");
		let cursor = $state<Cursor | null>(
			options.initialCursor
				? options.initialCursor === "end"
					? null
					: options.initialCursor
				: null
		);
		let end = $state(options.initialCursor === "end");
		let take = $state<Take>(options.take.default);

		return {
			get query() {
				return query;
			},
			set query(value) {
				query = value;
				cursor = null;
				end = false;
			},
			get cursor() {
				return end ? null : cursor;
			},
			set cursor(value) {
				cursor = value;
				end = false;
			},
			get end() {
				return end;
			},
			set end(value) {
				end = value;
			},
			get take() {
				return take;
			},
			set take(value) {
				take = value;
			}
		};
	}

	export type OffsetPaginationResult<T> = {
		page: number;
		perPage: number;
		prev: T | null;
		next: T | null;
		isDone: boolean;
		total: number;
	};

	type PaginationDefaults = {
		take: number;
	};

	export type OffsetPaginatorProps<T> = {
		class?: string;
		cursor: T | null;
		end: boolean;
		pagination: OffsetPaginationResult<T>;
	} & HTMLAttributes<HTMLUListElement>;

	export function useOffsetPaginator<T>(
		getData: () => OffsetPaginationResult<T> | null | undefined,
		defaults: PaginationDefaults
	): OffsetPaginationResult<T> {
		let data = $state(getData());
		$effect(() => {
			const newData = getData();
			if (!newData) return;
			data = newData;
		});

		return {
			get page() {
				return data?.page ?? 1;
			},
			get perPage() {
				return data?.perPage ?? defaults.take;
			},
			get prev() {
				return data?.prev ?? null;
			},
			get next() {
				return data?.next ?? null;
			},
			get isDone() {
				return data?.isDone ?? true;
			},
			get total() {
				return data?.total ?? 0;
			}
		};
	}
</script>

<script lang="ts" generics="T">
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import { Button } from "@versetools/ui";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	let {
		class: className,
		cursor = $bindable(null),
		end = $bindable(false),
		pagination,
		...rest
	}: OffsetPaginatorProps<T> = $props();

	const lastPage = $derived(Math.ceil(pagination.total / pagination.perPage));
</script>

{#snippet pageButton(pageNumber: number, targetCursor: T | "start" | "end" | null)}
	{@const cursorValue = targetCursor === "start" || targetCursor === "end" ? null : targetCursor}
	{@const endValue = targetCursor === "end"}
	<li class="min-w-5 text-center text-sm">
		<button
			aria-label="Page {pageNumber} of all pages"
			type="button"
			class={twMerge(
				"w-full",
				!targetCursor ? "font-medium" : "text-text-80 hover:text-text cursor-pointer"
			)}
			data-cursor={targetCursor}
			disabled={targetCursor && cursor === cursorValue && end === endValue}
			onclick={targetCursor
				? () => {
						cursor = cursorValue;
						end = endValue;
					}
				: undefined}
		>
			{pageNumber}
		</button>
	</li>
{/snippet}

<ul {...rest} class={twMerge("flex items-center gap-1", className)}>
	<li>
		<Button
			aria-label="Previous page"
			variant="ghost"
			size="icon-sm"
			data-cursor={pagination.prev}
			disabled={!pagination.prev || cursor === pagination.prev}
			onclick={() => {
				if (!pagination.prev) return;
				cursor = pagination.prev;
				end = false;
			}}
		>
			<ChevronLeftIcon />
		</Button>
	</li>
	{#if pagination.page > 1}
		{@render pageButton(1, "start")}
		{#if !pagination.prev || pagination.page - 1 > 2}
			<li class="min-w-5 select-none text-center text-sm">...</li>
		{/if}
	{/if}
	{#if pagination.prev && pagination.page - 1 > 1}
		{@render pageButton(pagination.page - 1, pagination.prev)}
	{/if}
	{@render pageButton(pagination.page, null)}
	{#if pagination.next && pagination.page + 1 < lastPage}
		{@render pageButton(pagination.page + 1, pagination.next)}
	{/if}
	{#if pagination.page < lastPage}
		{#if !pagination.next || pagination.page + 1 < lastPage - 1}
			<li class="min-w-5 select-none text-center text-sm">...</li>
		{/if}
		{@render pageButton(lastPage, "end")}
	{/if}
	<li>
		<Button
			aria-label="Next page"
			variant="ghost"
			size="icon-sm"
			data-cursor={pagination.next}
			disabled={!pagination.next || cursor === pagination.next}
			onclick={() => {
				if (!pagination.next) return;
				cursor = pagination.next;
				end = false;
			}}
		>
			<ChevronRightIcon />
		</Button>
	</li>
</ul>
