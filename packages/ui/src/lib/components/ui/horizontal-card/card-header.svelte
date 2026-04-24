<script lang="ts" module>
	const breakpoints = {
		lg: "@lg:flex-1 @lg:max-w-2xs @4xl:max-w-md @lg:pb-8",
		xl: "@xl:flex-1 @xl:max-w-2xs @4xl:max-w-md @xl:pb-8",
		"2xl": "@2xl:flex-1 @2xl:max-w-2xs @4xl:max-w-md @2xl:pb-8",
		"3xl": "@3xl:flex-1 @3xl:max-w-2xs @4xl:max-w-md @3xl:pb-8",
		"4xl": "@4xl:flex-1 @4xl:max-w-md @4xl:pb-8"
	} satisfies Record<HorizontalCardBreakpoint, string>;

	export type HorizontalCardHeaderProps = CardHeaderProps & {
		breakpoint?: keyof typeof breakpoints;
	};
</script>

<script lang="ts">
	import { twMerge } from "tailwind-merge";

	import { getHorizontalCardContext, type HorizontalCardBreakpoint } from "./context";
	import CardHeader, { type CardHeaderProps } from "../card/card-header.svelte";

	const ctx = getHorizontalCardContext();

	let {
		class: className,
		breakpoint = ctx.breakpoint,
		children,
		...rest
	}: HorizontalCardHeaderProps = $props();
</script>

<CardHeader {...rest} class={twMerge(breakpoints[breakpoint], className)}>
	{@render children?.()}
</CardHeader>
