<script lang="ts" module>
	import type { AnyMeltElement } from "@melt-ui/svelte";

	type DrawerDescriptionAsProps =
		| ({ as?: "p" } & HTMLAttributes<HTMLParagraphElement>)
		| ({ as: "span" } & HTMLAttributes<HTMLSpanElement>);

	export type DrawerDescriptionProps = {
		class?: string;
		children?: Snippet;
		element?: AnyMeltElement;
	} & DrawerDescriptionAsProps;
</script>

<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import { getDrawerContext } from "./context";

	const { dialog } = getDrawerContext();

	let {
		as = "p",
		class: className,
		children,
		element = dialog.elements.description,
		...rest
	}: DrawerDescriptionProps = $props();
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
