<script lang="ts" module>
	const variants = tv({
		base: "relative w-full",
		variants: {
			variant: {
				primary:
					"[--card-bg-hover:var(--color-card-hover)] [--card-bg:var(--color-card)] [--card-border-hover:var(--color-card-border-hover)] [--card-border:var(--color-card-border)]",
				secondary:
					"[--card-bg-hover:var(--color-card-secondary-hover)] [--card-bg:var(--color-card-secondary)] [--card-border-hover:var(--color-card-secondary-border-hover)] [--card-border:var(--color-card-secondary-border)]",
				ghost:
					"[--card-bg-hover:var(--color-light)] [--card-border-hover:transparent] [--card-border:transparent]",
				destructive:
					"[--card-bg-hover:var(--color-card-destructive-hover)] [--card-bg:var(--color-card-destructive)] [--card-border-hover:var(--color-card-destructive-border-hover)] [--card-border:var(--color-card-destructive-border)]"
			},
			size: {
				full: "max-w-none",
				sm: "max-w-sm",
				md: "max-w-md",
				lg: "max-w-lg",
				xl: "max-w-xl",
				"2xl": "max-w-2xl",
				"3xl": "max-w-3xl",
				"4xl": "max-w-4xl"
			},
			clickable: {
				true: "group/clickable-card data-disabled:cursor-not-allowed data-disabled:opacity-50 cursor-pointer text-left disabled:cursor-not-allowed disabled:opacity-50"
			}
		}
	});

	type Variant = VariantProps<typeof variants>;

	export type CardAsProps =
		| ({ as?: "a"; href: string } & HTMLAnchorAttributes)
		| ({ as?: "button" } & HTMLButtonAttributes)
		| ({
				as?: "section" | "article" | "div" | undefined;
				href?: undefined;
		  } & HTMLAttributes<HTMLElement>);

	export type BaseCardProps = {
		class?: string;
		"inner-class"?: string;
		bgClass?: string;
		corners?: CornersConfig;
		children?: Snippet;
		element?: AnyMeltElement;
	} & Variant;

	export type CardProps = BaseCardProps & CardAsProps;
</script>

<script
	lang="ts"
	generics="InOutTransition extends Transition<any>, InTransition extends Transition<any>, OutTransition extends Transition<any>"
>
	import { emptyMeltElement, type AnyMeltElement } from "@melt-ui/svelte";
	import type { Snippet } from "svelte";
	import type { HTMLAnchorAttributes, HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";
	import { tv, type VariantProps } from "tailwind-variants";

	import StyledRect from "$lib/components/ui/styled-rect.svelte";
	import type { CornersConfig } from "$lib/components/ui/styled-rect.svelte";
	import { noop, type Transition, type TransitionsProps } from "$lib/transitions";

	let {
		as = "section",
		class: className,
		"inner-class": innerClass,
		bgClass,
		variant = "primary",
		size = "md",
		corners = "none large",
		children,
		element = emptyMeltElement as AnyMeltElement,
		transition,
		transitionParams,
		transitionIn = (transition ?? noop) as InTransition,
		transitionInParams,
		transitionOut = (transition ?? noop) as OutTransition,
		transitionOutParams,
		...rest
	}: CardProps & TransitionsProps<InOutTransition, InTransition, OutTransition> = $props();

	const backgroundVariants = $derived(
		tv({
			base: "absolute left-0 top-0 h-full w-full",
			variants: {
				variant: {
					ghost: `opacity-0 transition-opacity group-hover/clickable-card:opacity-5 group-disabled/clickable-card:opacity-0`
				} as typeof variants.variants.variant
			}
		})
	);

	const clickable = $derived(as === "button" || as === "a");
</script>

<svelte:element
	this={as}
	type={as === "button" ? "button" : undefined}
	data-variant={variant}
	data-clickable={clickable}
	{...rest}
	{...element}
	use:element
	class={twMerge(variants({ variant, size, clickable }), className)}
	in:transitionIn={transitionInParams ?? transitionParams}
	out:transitionOut={transitionOutParams ?? transitionParams}
>
	{#if clickable}
		<StyledRect
			class={twMerge(backgroundVariants({ variant }), bgClass)}
			{corners}
			rounded="large"
			bg="var(--card-bg-hover,var(--card-bg))"
			border="var(--card-border-hover,var(--card-border))"
		/>
	{/if}
	<StyledRect
		class={twMerge(
			backgroundVariants({ variant }),
			`group-hover/clickable-card:opacity-0 group-disabled/clickable-card:opacity-0`,
			bgClass
		)}
		{corners}
		rounded="large"
		bg="--card-bg"
		border="--card-border"
	/>
	<div class={twMerge("relative flex h-full w-full flex-col p-px", innerClass)}>
		{@render children?.()}
	</div>
</svelte:element>
