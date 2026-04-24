<script lang="ts" module>
	export type SidebarSection = {
		title: string;
	};

	export type SidebarNavProps<TItem extends SidebarItem<any>> = {
		items: (TItem | SidebarSection)[];
		class?: string;
		"item-class"?: string;
		"item-inner-class"?: string;
		itemEnd?: Snippet<[TItem]>;
		isItemActive?: (item: TItem, url: URL) => boolean;
	};
</script>

<script lang="ts" generics="TItem extends SidebarItem<any>">
	import type { Snippet } from "svelte";
	import { twMerge } from "tailwind-merge";

	import type { SidebarItem } from "./sidebar-item.svelte";
	import Item from "./sidebar-item.svelte";

	function defaultIsItemActive(item: TItem, url: URL) {
		if (!item.href) return false;

		const itemUrl = new URL(item.href, url);
		return itemUrl.pathname.replace(/\/$/, "") === url.pathname.replace(/\/$/, "");
	}

	let {
		items,
		class: className,
		"item-class": itemClass,
		"item-inner-class": itemInnerClass,
		itemEnd,
		isItemActive = defaultIsItemActive
	}: SidebarNavProps<TItem> = $props();
</script>

<nav class={twMerge("flex flex-col px-4 tracking-wide", className)}>
	{#each items as item (item)}
		{#if "title" in item}
			<span class="pb-1 text-xs font-medium not-first:pt-4">{item.title}</span>
		{:else}
			<Item class={itemClass} inner-class={itemInnerClass} {item} {itemEnd} {isItemActive} />
		{/if}
	{/each}
</nav>
