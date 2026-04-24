<script lang="ts" module>
	export type NavExpandableItemGroupProps = {
		items: (NavItem | NavItemGroup)[];
		children: Snippet;
		floatingConfig?: Partial<UseFloatingConfig>;
	} & HTMLButtonAttributes;
</script>

<script lang="ts">
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import type { UseFloatingConfig } from "melt";
	import { Popover } from "melt/builders";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import { page } from "$app/state";
	import { smoothScrolling } from "$lib/helpers";

	import Self from "./nav-expandable-item-group.svelte";
	import type { NavItem, NavItemGroup } from "./nav-list.svelte";

	let { items, children, floatingConfig, ...rest }: NavExpandableItemGroupProps = $props();

	const popover = new Popover({
		floatingConfig: {
			sameWidth: false,
			...floatingConfig,
			computePosition: {
				placement: "bottom-end",
				strategy: "absolute",
				...floatingConfig?.computePosition
			},
			offset:
				typeof floatingConfig?.offset !== "object"
					? floatingConfig?.offset
					: {
							mainAxis: 28,
							crossAxis: 16,
							...floatingConfig?.offset
						}
		}
	});
</script>

<button
	type="button"
	{...popover.trigger}
	{...rest}
	class={twMerge(
		"flex cursor-pointer items-center gap-1 opacity-80 transition-opacity hover:opacity-100",
		popover.open && "opacity-100"
	)}
>
	{@render children()}
	<ChevronDownIcon
		class={twMerge("size-5 transition-transform", popover.open && "rotate-180")}
		strokeWidth="3"
	/>
</button>
<ul
	{...popover.content}
	class="bg-background border-1 border-border overflow-hidden rounded-sm border-t-0"
>
	{#each items as item ("items" in item ? `group:${item.name}` : item.href)}
		{#if "items" in item}
			<Self items={item.items}>
				<span class="font-medium">{item.name}</span>
			</Self>
		{:else}
			{@const active = item.isActive ? item.isActive(page.url) : page.url.pathname === item.href}
			{@const smoothScrollingProps = smoothScrolling(item.href)}
			<a
				href={item.href}
				{...smoothScrollingProps}
				onclick={(e) => {
					popover.open = false;
					smoothScrollingProps.onclick?.(e);
				}}
				class="group/nav-item text-text block bg-white/0 px-4 py-1.5 hover:bg-white/5"
			>
				<div class="w-fit">
					<span class="font-medium">{item.name}</span>
					<div
						class={twMerge(
							"bg-text/90 h-[2px] transition-all group-hover/nav-item:w-full",
							active ? "w-full" : "w-[14px]"
						)}
					></div>
				</div>
			</a>
		{/if}
	{/each}
</ul>
