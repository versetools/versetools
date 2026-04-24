<script lang="ts" module>
	export const optionVariants = tv({
		base: "group/item relative cursor-pointer",
		variants: {
			size: {
				sm: "px-1.5 py-0.5 text-xs font-medium first-of-type:pl-2.5 last-of-type:pr-2.5",
				base: "px-2 py-0.5 text-sm font-medium first-of-type:pl-3.5 last-of-type:pr-3.5"
			},
			variant: {
				primary:
					"data-highlighted:[--segmented-item-hover:var(--color-light-80)] text-dark [--segmented-item:var(--color-light)]",
				accent:
					"data-highlighted:[--segmented-item-hover:var(--color-accent-80)] [--segmented-item:var(--color-accent)]",
				success:
					"data-highlighted:[--segmented-item-hover:var(--color-success)] [--segmented-item:var(--color-success-dark)]",
				destructive:
					"data-highlighted:[--segmented-item-hover:var(--color-destructive-light)] [--segmented-item:var(--color-destructive)]"
			}
		}
	});

	export type OptionVariant = VariantProps<typeof optionVariants>;

	export type SegmentedButtonOption<T> = {
		name: string;
		value: T;
		variant?: OptionVariant["variant"];
		tooltip?: string | Snippet;
		Tooltip?: Component;
	};

	export type SegmentedButtonItemProps<T, TOption extends SegmentedButtonOption<T>> = {
		class?: string;
		index: number;
		totalOptions: number;
		item: SegmentedControlItem<T>;
		option: TOption;
	} & OptionVariant &
		HTMLLabelAttributes;
</script>

<script lang="ts" generics="T, TOption extends SegmentedButtonOption<T>">
	import type { Component, Snippet } from "svelte";
	import type { HTMLLabelAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";
	import { tv, type VariantProps } from "tailwind-variants";

	import type { SegmentedControlItem } from "$lib/builders";

	import StyledRect from "../styled-rect.svelte";

	let {
		class: className,
		variant,
		size = "base",
		index,
		totalOptions,
		item,
		option,
		...rest
	}: SegmentedButtonItemProps<T, TOption> = $props();
</script>

<label
	{...rest}
	{...item.label}
	class={twMerge(
		optionVariants({ size, variant: item.checked ? (option.variant ?? variant) : undefined }),
		!item.checked &&
			"data-highlighted:[--segmented-item-hover:var(--color-light)] [--segmented-item:var(--color-light)]",
		className
	)}
>
	<StyledRect
		class={twMerge(
			"absolute left-0 top-0 h-full w-full",
			!item.checked && (item.highlighted ? "opacity-10" : "opacity-0")
		)}
		corners="{index === 0 ? 'small' : 'none'} {index === totalOptions - 1 ? 'small' : 'none'}"
		inner
		bg="var(--segmented-item-hover,var(--segmented-item))"
	/>
	<input {...item.input} />
	<span class="relative select-none">{option.name}</span>
</label>
