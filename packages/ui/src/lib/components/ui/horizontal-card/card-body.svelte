<script lang="ts" module>
	const breakpoints = {
		lg: "@lg:flex-1 @lg:p-4 @lg:min-w-sm @lg:max-w-lg @3xl:w-full @3xl:flex-none",
		xl: "@xl:flex-1 @xl:p-4 @xl:min-w-sm @xl:max-w-lg @3xl:w-full @3xl:flex-none",
		"2xl": "@2xl:flex-1 @2xl:p-4 @2xl:min-w-sm @2xl:max-w-lg @4xl:w-full @4xl:flex-none",
		"3xl": "@3xl:flex-1 @3xl:p-4 @3xl:min-w-sm @3xl:max-w-lg @4xl:w-full @4xl:flex-none",
		"4xl": "@4xl:flex-1 @4xl:p-4 @4xl:min-w-sm @4xl:max-w-lg @4xl:w-full @4xl:flex-none"
	} satisfies Record<HorizontalCardBreakpoint, string>;

	export type HorizontalCardBodyProps = CardBodyProps & {
		breakpoint?: keyof typeof breakpoints;
	};
</script>

<script lang="ts">
	import { twMerge } from "tailwind-merge";

	import { getHorizontalCardContext, type HorizontalCardBreakpoint } from "./context";
	import CardBody, { type CardBodyProps } from "../card/card-body.svelte";

	const ctx = getHorizontalCardContext();

	let {
		class: className,
		breakpoint = ctx.breakpoint,
		children,
		...rest
	}: HorizontalCardBodyProps = $props();
</script>

<CardBody {...rest} class={twMerge(breakpoints[breakpoint], className)}>
	{@render children?.()}
</CardBody>
