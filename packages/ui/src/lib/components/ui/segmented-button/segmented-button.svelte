<script lang="ts" module>
	export type SegmentedButtonProps<T, TOption extends SegmentedButtonOption<T>> = {
		class?: string;
		value?: T | null | undefined;
		cycle?: boolean;
		options: TOption[];
		option?: Snippet<[{ index: number; item: SegmentedControlItem<T>; option: TOption }]>;
	} & OptionVariant &
		Omit<HTMLInputAttributes, "size">;
</script>

<script lang="ts" generics="T, TOption extends SegmentedButtonOption<T>">
	import type { Snippet } from "svelte";
	import type { HTMLInputAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import { SegmentedControl, type SegmentedControlItem } from "$lib/builders";

	import StyledRect from "../styled-rect.svelte";
	import SegmentedButtonItem, {
		type OptionVariant,
		type SegmentedButtonOption
	} from "./segmented-button-item.svelte";
	import Tooltip from "../tooltip.svelte";

	let {
		class: className,
		variant = "primary",
		size = "base",
		value = $bindable(),
		options,
		cycle,
		disabled,
		required,
		option,
		...rest
	}: SegmentedButtonProps<T, TOption> = $props();

	const control = $derived(
		new SegmentedControl<T>({
			value: value ?? undefined,
			disabled: disabled ?? undefined,
			required: required ?? undefined,
			cycle,
			orientation: "horizontal",
			onValueChange(v) {
				value = v;
			}
		})
	);
</script>

<input {...control.hiddenInput} {...rest} />
<div {...control.root} class={twMerge("relative", className)}>
	<StyledRect
		class="absolute top-0 left-0 h-full w-full"
		corners="small"
		bg="--color-input"
		border="--color-input-border"
	/>
	<div class="relative flex p-1">
		{#each options as opt, i (opt.value)}
			{@const item = control.getItem(opt.value)}
			{#if option}
				{@render option({ index: i, item, option: opt })}
			{:else if opt.tooltip || opt.Tooltip}
				<Tooltip triggerId={item.label.id}>
					{#snippet trigger(props)}
						<SegmentedButtonItem
							index={i}
							totalOptions={options.length}
							{item}
							option={opt}
							{variant}
							{size}
							{...props}
						/>
					{/snippet}
					{#if opt.Tooltip}
						<opt.Tooltip />
					{:else if typeof opt.tooltip === "string"}
						{opt.tooltip}
					{:else if opt.tooltip}
						{@render opt.tooltip()}
					{/if}
				</Tooltip>
			{:else}
				<SegmentedButtonItem
					index={i}
					totalOptions={options.length}
					{item}
					option={opt}
					{variant}
					{size}
				/>
			{/if}
		{/each}
	</div>
</div>
