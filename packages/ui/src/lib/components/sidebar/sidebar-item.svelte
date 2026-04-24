<script lang="ts" module>
	export type SidebarItem<T = any> = {
		name: string;
		image?: { src: string; alt: string };
		Icon?: Component;
		isActive?: boolean | ((url: URL) => boolean);
		metadata?: T;
	} & (
		| {
				href: string;
				onclick?: undefined;
		  }
		| {
				href?: undefined;
				onclick: (event: MouseEvent) => unknown;
				subItems?: SidebarItem<any>[];
		  }
	);

	export type SidebarItemProps<TItem extends SidebarItem<any>> = {
		class?: string;
		"inner-class"?: string;
		item: TItem;
		itemEnd?: Snippet<[TItem]>;
		isItemActive: (item: TItem, url: URL) => boolean;
	};
</script>

<script lang="ts" generics="TItem extends SidebarItem<any>">
	import { ChevronDownIcon } from "@lucide/svelte";
	import { Collapsible } from "melt/builders";
	import type { Component, Snippet } from "svelte";
	import { slide } from "svelte/transition";
	import { twMerge } from "tailwind-merge";

	import { page } from "$app/state";

	import Self from "./sidebar-item.svelte";
	import Button from "../ui/button.svelte";

	let {
		class: className,
		"inner-class": innerClass,
		item,
		itemEnd,
		isItemActive
	}: SidebarItemProps<TItem> = $props();

	function resolveIsActive(url: URL, isActive: boolean | ((url: URL) => boolean)) {
		return typeof isActive === "function" ? isActive(url) : isActive;
	}

	function isSubItemActive(subItems: SidebarItem<any>[], url: URL): boolean {
		let active = false;
		for (const subItem of subItems) {
			active = subItem.isActive
				? resolveIsActive(url, subItem.isActive)
				: isItemActive(subItem as TItem, url);

			if (!active && "subItems" in subItem && subItem.subItems) {
				active = isSubItemActive(subItem.subItems, url);
			}

			if (active) break;
		}

		return active;
	}

	const active = $derived(
		item.isActive ? resolveIsActive(page.url, item.isActive) : isItemActive(item, page.url)
	);
	const collapsible =
		"subItems" in item && item.subItems
			? new Collapsible({
					open: isSubItemActive(item.subItems, page.url)
				})
			: null;
</script>

<Button
	{...collapsible?.trigger}
	href={item.href}
	size="sm"
	variant={active ? "accent" : "ghost"}
	corners="none small"
	class={twMerge("pl-3", className)}
	inner-class="flex-1"
	bg-class="transition-none group-hover/button:transition-opacity"
	onclick={item.onclick}
>
	{#snippet icon(cls: string)}
		{#if item.image}
			<img src={item.image.src} class={cls} alt={item.image.alt} />
		{:else if item.Icon}
			<item.Icon class={cls} />
		{/if}
	{/snippet}
	<span class={twMerge("line-clamp-1 flex-1 break-all font-medium", innerClass)}>{item.name}</span>
	{@render itemEnd?.(item)}
	{#if collapsible}
		<ChevronDownIcon
			class={twMerge("ml-auto size-5 shrink-0", collapsible.open ? "rotate-180" : "")}
		/>
	{/if}
</Button>

{#if "subItems" in item && item.subItems && collapsible?.open}
	<div
		{...collapsible.content}
		class="border-sidebar-subitem-border ml-2.5 border-l-2 pl-1"
		transition:slide
	>
		{#each item.subItems as subItem (subItem)}
			<Self
				class={className}
				inner-class={innerClass}
				item={subItem as unknown as TItem}
				{itemEnd}
				{isItemActive}
			/>
		{/each}
	</div>
{/if}
