<script lang="ts" module>
	type CardDescriptionAsProps =
		| ({ as?: "p" } & HTMLAttributes<HTMLParagraphElement>)
		| ({ as: "span" } & HTMLAttributes<HTMLSpanElement>);

	export type CardDescriptionProps = {
		class?: string;
		children?: Snippet;
		element?: AnyMeltElement;
	} & CardDescriptionAsProps;
</script>

<script lang="ts">
	import { emptyMeltElement, type AnyMeltElement } from "@melt-ui/svelte";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	let {
		as = "p",
		class: className,
		children,
		element = emptyMeltElement as AnyMeltElement,
		...rest
	}: CardDescriptionProps = $props();
</script>

<svelte:element
	this={as}
	{...rest}
	{...element}
	use:element
	class={twMerge("text-text-80 text-sm font-medium", className)}
>
	{@render children?.()}
</svelte:element>
