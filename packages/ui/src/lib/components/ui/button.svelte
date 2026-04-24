<script lang="ts" module>
	const variants = tv({
		base: "group/button relative flex cursor-pointer items-center [--button-border:transparent] disabled:cursor-not-allowed disabled:brightness-75",
		variants: {
			variant: {
				primary:
					"text-button-text [--button-bg-hover:var(--color-button-hover)] [--button-bg:var(--color-button)] [--button-border-hover:var(--color-button-border-hover)] [--button-border:var(--color-button-border)]",
				secondary:
					"text-button-secondary-text [--button-bg-hover:var(--color-button-secondary-hover)] [--button-bg:var(--color-button-secondary)] [--button-border-hover:var(--color-button-secondary-border-hover)] [--button-border:var(--color-button-secondary-border)]",
				accent:
					"text-button-accent-text [--button-bg-hover:var(--color-button-accent-hover)] [--button-bg:var(--color-button-accent)] [--button-border-hover:var(--color-button-accent-border-hover)] [--button-border:var(--color-button-accent-border)]",
				outline:
					"text-button-outline-text [--button-bg:var(--color-button-outline)] [--button-border-hover:var(--color-button-outline-border-hover)] [--button-border:var(--color-button-outline-border)]",
				ghost:
					"text-text [--button-bg-hover:var(--color-light)] [--card-border-hover:transparent] [--card-border:transparent]",
				"ghost-success":
					"text-text [--button-bg-hover:var(--color-success-light)] [--card-border-hover:transparent] [--card-border:transparent]",
				"ghost-destructive":
					"text-text [--button-bg-hover:var(--color-destructive-light)] [--card-border-hover:transparent] [--card-border:transparent]",
				destructive:
					"text-button-destructive-text [--button-bg-hover:var(--color-button-destructive-hover)] [--button-bg:var(--color-button-destructive)] [--button-border-hover:var(--color-button-destructive-border-hover)] [--button-border:var(--color-button-destructive-border)]",
				discord:
					"text-button-discord-text [--button-bg-hover:var(--color-button-discord-hover)] [--button-bg:var(--color-button-discord)] [--button-border-hover:var(--color-button-discord-border-hover)] [--button-border:var(--color-button-discord-border)]"
			},
			size: {
				xs: "px-4 py-1 text-xs font-medium",
				sm: "px-5 py-2 text-sm font-medium",
				base: "px-6 py-2.5 text-base font-medium",
				lg: "px-12 py-3 text-lg font-medium",
				icon: "p-2 text-base font-medium",
				"icon-sm": "p-1 text-base font-medium"
			},
			corners: cornersVariant
		},
		compoundVariants: [
			{
				size: "sm",
				corners: cornersRightConfigs,
				class: "pl-4"
			},
			{
				size: "xs",
				corners: cornersRightConfigs,
				class: "pl-3"
			},
			{
				size: "base",
				corners: cornersRightConfigs,
				class: "pl-5"
			},
			{
				size: "lg",
				corners: cornersRightConfigs,
				class: "pl-10"
			},
			{
				size: "sm",
				corners: cornersLeftConfigs,
				class: "pr-4"
			},
			{
				size: "xs",
				corners: cornersLeftConfigs,
				class: "pr-3"
			},
			{
				size: "base",
				corners: cornersLeftConfigs,
				class: "pr-5"
			},
			{
				size: "lg",
				corners: cornersLeftConfigs,
				class: "pr-10"
			}
		]
	});

	type Variant = VariantProps<typeof variants>;

	export type BaseButtonProps = {
		type?: "submit" | "button" | "reset";
		class?: string;
		"bg-class"?: string;
		"inner-class"?: string;
		corners?: CornersConfig;
		Icon?: Component<{ class?: string }>;
		iconProps?: Record<string, any>;
		icon?: Snippet<[string]>;
		"icon-class"?: string;
		"icon-align"?: "left" | "right";
		rounded?: "small" | "large";
		fill?: boolean;
		noanimate?: boolean;
		nopattern?: boolean;
		children?: Snippet;
		element?: AnyMeltElement;
	} & Variant;

	export type ButtonProps = BaseButtonProps &
		(({ href: string } & HTMLAnchorAttributes) | ({ href?: undefined } & HTMLButtonAttributes));
</script>

<script lang="ts">
	import { emptyMeltElement, type AnyMeltElement } from "@melt-ui/svelte";
	import { onMount, type Component, type Snippet } from "svelte";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";
	import { tv, type VariantProps } from "tailwind-variants";

	import { smoothScrolling } from "$lib/helpers";
	import Twill from "$lib/patterns/twill.svelte";

	import StyledRect, {
		cornersLeftConfigs,
		cornersRightConfigs,
		cornersVariant,
		type CornersConfig
	} from "./styled-rect.svelte";

	const backgroundVariants = tv({
		base: "absolute left-0 top-0 h-full w-full",
		variants: {
			variant: {
				ghost:
					"opacity-0 transition-opacity group-hover/button:opacity-5 group-disabled/button:opacity-0",
				"ghost-success":
					"opacity-0 transition-opacity group-hover/button:opacity-10 group-disabled/button:opacity-0",
				"ghost-destructive":
					"opacity-0 transition-opacity group-hover/button:opacity-10 group-disabled/button:opacity-0"
			} as typeof variants.variants.variant
		}
	});

	const iconVariants = tv({
		variants: {
			size: {
				xs: "size-4",
				sm: "size-5",
				base: "size-6",
				lg: "size-7",
				icon: "size-5",
				"icon-sm": "size-4"
			} satisfies typeof variants.variants.size
		}
	});

	let {
		href,
		type = "button",
		class: className,
		"bg-class": bgClass,
		"inner-class": innerClass,
		variant = "primary",
		size = "base",
		corners = size.startsWith("icon") ? "none" : "small",
		rounded,
		fill = false,
		noanimate,
		nopattern,
		Icon,
		iconProps,
		icon,
		"icon-class": iconClass,
		"icon-align": iconAlign = "left",
		children,
		element = emptyMeltElement as AnyMeltElement,
		onclick,
		...rest
	}: ButtonProps = $props();

	const iconClasses = $derived(twMerge(iconVariants({ size }), iconClass));
	const smoothScrollingProps = smoothScrolling(href);

	let twillOffset = $state(0);

	function animateTwill() {
		if (noanimate || nopattern || variant !== "destructive") return;

		const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (prefersReducedMotion) return;

		twillOffset += 0.1;
		requestAnimationFrame(animateTwill);
	}

	onMount(() => {
		animateTwill();
	});
</script>

<svelte:element
	this={href ? "a" : "button"}
	{href}
	role="button"
	tabindex="0"
	{type}
	{...smoothScrollingProps}
	{...rest}
	{...$element}
	use:element
	class={twMerge(variants({ size, variant, corners }), fill && "w-full", className)}
	onclick={(e: any) => {
		onclick?.(e);
		smoothScrollingProps.onclick?.(e);
	}}
>
	<StyledRect
		class={twMerge(backgroundVariants({ variant }), bgClass)}
		{corners}
		inner={size === "xs"}
		{rounded}
		bg="var(--button-bg-hover,var(--button-bg))"
		border="var(--button-border-hover,var(--button-border))"
	/>
	{#if !variant.startsWith("ghost")}
		<StyledRect
			class={twMerge(
				backgroundVariants({ variant }),
				"transition-opacity group-hover/button:opacity-0 group-disabled/button:opacity-0",
				bgClass
			)}
			{corners}
			inner={size === "xs"}
			{rounded}
			bg="--button-bg"
			border="--button-border"
		/>
	{/if}
	{#if variant === "destructive" && !nopattern}
		<div
			class={twMerge(
				"absolute left-0 top-0 h-full w-full overflow-hidden",
				rounded === "large" ? "rounded-md" : "rounded-sm"
			)}
		>
			<Twill
				class="opacity-25"
				size="thick"
				{corners}
				offsetX={twillOffset}
				stroke="var(--button-bg-hover)"
			/>
		</div>
	{/if}
	<div class={twMerge("relative flex items-center gap-2 text-left transition-colors", innerClass)}>
		{#if iconAlign === "left"}
			{#if Icon}
				<Icon {...iconProps} class={iconClasses} />
			{:else if icon}
				{@render icon(iconClasses)}
			{/if}
		{/if}
		{@render children?.()}
		{#if iconAlign === "right"}
			{#if Icon}
				<Icon {...iconProps} class={iconClasses} />
			{:else if icon}
				{@render icon(iconClasses)}
			{/if}
		{/if}
	</div>
</svelte:element>
