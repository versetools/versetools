<script lang="ts" module>
	const variants = tv({
		base: "relative flex",
		variants: {
			variant: {
				default:
					"[--input-bg:var(--color-input)] [--input-border:var(--color-input-border)] [--input-text:var(--color-input-text)]",
				destructive:
					"[--input-bg:var(--color-input-destructive)] [--input-border:var(--color-input-destructive-border)] [--input-text:var(--color-input-destructive-text)]"
			},
			disabled: {
				true: ""
			},
			readonly: {
				true: ""
			}
		},
		compoundVariants: [
			{
				disabled: true,
				variant: "default",
				class:
					"[--input-bg:var(--color-input-disabled)] [--input-border:var(--color-input-border-disabled)] [--input-text:var(--color-input-text-disabled)]"
			},
			{
				readonly: true,
				variant: "default",
				class:
					"[--input-border:var(--color-input-border-disabled)] [--input-text:var(--color-input-text-disabled)]"
			},
			{
				disabled: true,
				variant: "destructive",
				class:
					"[--input-bg:var(--color-input-destructive-disabled)] [--input-border:var(--color-input-destructive-border-disabled)] [--input-text:var(--color-input-destructive-text-disabled)]"
			},
			{
				readonly: true,
				variant: "destructive",
				class:
					"[--input-border:var(--color-input-destructive-border-disabled)] [--input-text:var(--color-input-destructive-text-disabled)]"
			}
		]
	});

	type Variant = VariantProps<typeof variants>;

	const inputVariants = tv({
		base: "outline-hidden placeholder:text-input-placeholder text-(--input-text) relative w-full !bg-transparent px-4 py-3",
		variants: {
			size: {
				sm: "py-2 text-sm font-medium placeholder:text-sm",
				base: "text-sm font-medium placeholder:text-sm",
				lg: "text-base font-medium placeholder:text-base"
			}
		}
	});

	type InputVariant = VariantProps<typeof inputVariants>;

	export type InputProps<T> = {
		class?: string;
		"input-class"?: string;
		corners?: CornersConfig;
		value?: T;
		ref?: HTMLInputElement | undefined;
		Icon?: Component;
		icon?: Snippet;
		button?: Snippet;
	} & Variant &
		InputVariant &
		Omit<HTMLInputAttributes, "size">;
</script>

<script lang="ts" generics="T">
	import type { Component, Snippet } from "svelte";
	import type { HTMLInputAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";
	import { tv, type VariantProps } from "tailwind-variants";

	import { Twill } from "$lib/patterns";

	import StyledRect, { type CornersConfig } from "./styled-rect.svelte";

	let {
		class: className,
		"input-class": inputClass,
		corners = "none small",
		variant = "default",
		size = "base",
		value = $bindable(),
		ref = $bindable(),
		disabled,
		readonly,
		Icon,
		icon,
		button,
		...rest
	}: InputProps<T> = $props();
</script>

<div class={twMerge(variants({ variant, disabled, readonly }), className)}>
	<StyledRect
		class="absolute left-0 top-0 h-full w-full"
		{corners}
		bg="--input-bg"
		border="--input-border"
	/>
	{#if disabled}
		<div class="absolute left-0 top-0 h-full w-full p-px">
			<Twill class="opacity-60" {corners} stroke="var(--input-border)" />
		</div>
	{/if}
	{#if Icon || icon}
		<div class="absolute left-2.5 top-1/2 -translate-y-1/2">
			{#if Icon}
				<Icon class={size === "sm" ? "size-4" : "size-5"} />
			{:else if icon}
				{@render icon()}
			{/if}
		</div>
	{/if}
	<input
		{...rest}
		{disabled}
		{readonly}
		class={twMerge(
			inputVariants({ size }),
			(disabled || readonly) && "cursor-not-allowed",
			(Icon || icon) && (size === "sm" ? "pl-8" : "pl-9"),
			inputClass
		)}
		bind:this={ref}
		bind:value
	/>
	{@render button?.()}
</div>
