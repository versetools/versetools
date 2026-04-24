<script lang="ts" module>
	const variants = tv({
		base: "font-medium tracking-wide",
		variants: {
			size: {
				base: "text-base",
				xs: "text-lg",
				sm: "text-xl",
				md: "text-2xl",
				lg: "text-3xl",
				xl: "text-4xl"
			}
		}
	});

	type Variant = VariantProps<typeof variants>;

	export type HeadingProps = {
		as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
		class?: string;
		element?: AnyMeltElement;
	} & Variant &
		HTMLAttributes<HTMLHeadingElement>;
</script>

<script lang="ts">
	import { emptyMeltElement, type AnyMeltElement } from "@melt-ui/svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";
	import { tv, type VariantProps } from "tailwind-variants";

	let {
		as = "h2",
		class: className,
		size = "md",
		children,
		element = emptyMeltElement as AnyMeltElement,
		...rest
	}: HeadingProps = $props();
</script>

<svelte:element
	this={as}
	{...rest}
	{...element}
	use:element
	class={twMerge(variants({ size }), className)}
>
	{@render children?.()}
</svelte:element>
