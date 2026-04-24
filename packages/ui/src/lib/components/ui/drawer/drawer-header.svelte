<script lang="ts" module>
	type DrawerHeaderAsProps =
		| ({ as: "button" } & HTMLButtonAttributes)
		| ({ as?: "header" | "div" } & HTMLAttributes<HTMLElement>);

	export type DrawerHeaderProps = {
		class?: string;
		inlineClose?: boolean;
		children: Snippet;
		element?: AnyMeltElement;
	} & DrawerHeaderAsProps;
</script>

<script lang="ts">
	import { emptyMeltElement, type AnyMeltElement } from "@melt-ui/svelte";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	let {
		as = "header",
		class: className,
		inlineClose,
		children,
		element = emptyMeltElement as AnyMeltElement,
		...rest
	}: DrawerHeaderProps = $props();
</script>

<svelte:element
	this={as}
	{...rest}
	{...element}
	use:element
	class={twMerge("flex flex-col px-5", inlineClose ? "pt-4" : "pt-14", className)}
>
	{@render children?.()}
</svelte:element>
