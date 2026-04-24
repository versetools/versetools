<script lang="ts" module>
	type CardHeaderAsProps =
		| ({ as: "button" } & HTMLButtonAttributes)
		| ({ as?: "header" | "div" } & HTMLAttributes<HTMLElement>);

	export type CardHeaderProps = {
		class?: string;
		children?: Snippet;
		element?: AnyMeltElement;
	} & CardHeaderAsProps;
</script>

<script lang="ts">
	import { emptyMeltElement, type AnyMeltElement } from "@melt-ui/svelte";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	let {
		as = "header",
		class: className,
		children,
		element = emptyMeltElement as AnyMeltElement,
		...rest
	}: CardHeaderProps = $props();
</script>

<svelte:element
	this={as}
	{...rest}
	{...element}
	use:element
	class={twMerge("flex flex-col gap-0.25 px-5 pt-4", className)}
>
	{@render children?.()}
</svelte:element>
