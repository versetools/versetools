<script lang="ts" module>
	export type NavItem = { name: string; href: string; isActive?: (url: URL) => boolean };

	export type NavMegaItem = NavItem & {
		description?: string;
	};

	export type NavItemGroup = {
		name: string;
		floatingConfig?: Partial<UseFloatingConfig>;
	} & (
		| {
				type?: "list";
				items: NavItem[];
		  }
		| {
				type: "mega";
				items: NavMegaItem[];
		  }
	);

	export type NavListProps = {
		items: (NavItem | NavItemGroup)[];
		more?:
			| boolean
			| {
					floatingConfig?: Partial<UseFloatingConfig>;
			  };
		class?: string;
	} & HTMLAttributes<HTMLUListElement>;
</script>

<script lang="ts">
	import type { UseFloatingConfig } from "melt";
	import { onMount } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import { page } from "$app/state";
	import { smoothScrolling } from "$lib/helpers";

	import NavExpandableItemGroup from "./nav-expandable-item-group.svelte";

	let { items, more = true, class: className }: NavListProps = $props();

	let showMore = $state(!!more);
	let moreItems = $state<(NavItem | NavItemGroup)[]>([]);
	let navList: HTMLUListElement;

	function toggleMoreButton() {
		if (!navList || !more) return;

		if (navList.scrollHeight <= navList.clientHeight) {
			moreItems = [];
			showMore = false;
			return;
		}

		let hiddenStartIndex = -1;

		const itemElements = Array.from(navList.querySelectorAll("li a")) as HTMLAnchorElement[];
		for (let i = 0; i < itemElements.length; i++) {
			const itemEl = itemElements[i]!;
			const offset = itemEl.offsetTop - navList.offsetTop;

			const visible = offset < navList.offsetHeight;
			if (!visible && hiddenStartIndex === -1) {
				hiddenStartIndex = i;
			}

			itemEl.tabIndex = visible ? 0 : -1;
		}

		if (hiddenStartIndex !== -1) {
			const hiddenItems = items.slice(hiddenStartIndex);
			if (hiddenItems.length !== moreItems.length) {
				moreItems = hiddenItems;
				showMore = !!hiddenItems.length;
			}
		}
	}

	function initNavList(el: HTMLUListElement) {
		navList = el;
		toggleMoreButton();
	}

	onMount(() => {
		window.addEventListener("resize", toggleMoreButton);
		toggleMoreButton();
		return () => {
			window.removeEventListener("resize", toggleMoreButton);
		};
	});
</script>

<ul
	use:initNavList
	class={twMerge(
		"flex h-[26px] flex-wrap items-start gap-x-12 gap-y-1.5 overflow-hidden",
		className
	)}
>
	{#each items as item ("items" in item ? `group:${item.name}` : item.href)}
		{#if "items" in item}
			<NavExpandableItemGroup items={item.items} floatingConfig={item.floatingConfig}>
				<span class="font-medium">{item.name}</span>
			</NavExpandableItemGroup>
		{:else}
			{@const active = item.isActive ? item.isActive(page.url) : page.url.pathname === item.href}
			{@const smoothScrollingProps = smoothScrolling(item.href)}
			<li>
				<a
					href={item.href}
					{...smoothScrollingProps}
					class={twMerge(
						"group/nav-item font-medium transition-opacity hover:opacity-100",
						active ? "opacity-100" : "opacity-80"
					)}
				>
					{item.name}
				</a>
			</li>
		{/if}
	{/each}
</ul>
{#if showMore}
	<NavExpandableItemGroup
		items={moreItems}
		floatingConfig={typeof more === "object" ? more.floatingConfig : undefined}
	>
		<span class="font-medium">More</span>
	</NavExpandableItemGroup>
{/if}
