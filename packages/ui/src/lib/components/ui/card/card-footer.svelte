<script lang="ts" module>
	type CardFooterAsProps =
		| ({ as: "button" } & HTMLButtonAttributes)
		| ({ as?: "footer" | "div" } & HTMLAttributes<HTMLElement>);

	export type CardFooterProps = {
		class?: string;
		children?: Snippet;
		element?: AnyMeltElement;
	} & CardFooterAsProps;
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
	}: CardFooterProps = $props();
</script>

<svelte:element
	this={as}
	{...rest}
	{...element}
	use:element
	class={twMerge("gap-0.25 flex flex-col px-5 pb-4", className)}
>
	{@render children?.()}
</svelte:element>
