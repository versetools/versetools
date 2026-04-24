<script lang="ts" module>
	type DrawerFooterAsProps =
		| ({ as: "button" } & HTMLButtonAttributes)
		| ({ as?: "footer" | "div" } & HTMLAttributes<HTMLElement>);

	export type DrawerFooterProps = {
		class?: string;
		children: Snippet;
		element?: AnyMeltElement;
	} & DrawerFooterAsProps;
</script>

<script lang="ts">
	import { emptyMeltElement, type AnyMeltElement } from "@melt-ui/svelte";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	let {
		as = "footer",
		class: className,
		children,
		element = emptyMeltElement as AnyMeltElement,
		...rest
	}: DrawerFooterProps = $props();
</script>

<svelte:element
	this={as}
	{...rest}
	{...element}
	use:element
	class={twMerge("flex flex-col px-5 pb-4", className)}
>
	{@render children?.()}
</svelte:element>
