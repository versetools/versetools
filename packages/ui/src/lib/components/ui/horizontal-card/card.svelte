<script lang="ts" module>
	const breakpoints = {
		lg: "@lg:flex-row @lg:justify-between",
		xl: "@xl:flex-row @xl:justify-between",
		"2xl": "@2xl:flex-row @2xl:justify-between",
		"3xl": "@3xl:flex-row @3xl:justify-between",
		"4xl": "@4xl:flex-row @4xl:justify-between"
	} satisfies Record<HorizontalCardBreakpoint, string>;

	export type HorizontalCardProps = CardProps & {
		breakpoint?: keyof typeof breakpoints;
	};
</script>

<script lang="ts">
	import { twMerge } from "tailwind-merge";

	import { setHorizontalCardContext, type HorizontalCardBreakpoint } from "./context";
	import Card, { type CardProps } from "../card/card.svelte";

	let { class: className, breakpoint = "2xl", children, ...rest }: HorizontalCardProps = $props();

	setHorizontalCardContext({
		get breakpoint() {
			return breakpoint;
		}
	});
</script>

<Card size="full" {...rest} inner-class={twMerge(breakpoints[breakpoint], className)}>
	{@render children?.()}
</Card>
