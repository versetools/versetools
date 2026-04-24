<script lang="ts" module>
	export type RadioGroupProps<T extends string> = {
		as?: "div" | "section";
		class?: string;
		options: T[];
		value?: T;
		orientation?: "vertical" | "horizontal";
		child?: Snippet<[{ group: RadioGroup; option: T }]>;
	} & HTMLInputAttributes;
</script>

<script lang="ts" generics="T extends string">
	import { RadioGroup } from "melt/builders";
	import type { Snippet } from "svelte";
	import type { HTMLInputAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import RadioGroupOption from "./radio-group-option.svelte";

	let {
		as = "div",
		class: className,
		options,
		value = $bindable(),
		name,
		disabled,
		required,
		orientation = "vertical",
		child,
		...rest
	}: RadioGroupProps<T> = $props();

	const group = new RadioGroup({
		name: name ?? undefined,
		value,
		disabled: disabled ?? undefined,
		required: required ?? undefined,
		orientation,
		onValueChange(v) {
			value = v;
		}
	});
</script>

<input {...group.hiddenInput} {...rest} />
<svelte:element
	this={as}
	{...group.root}
	class={twMerge("flex gap-x-8 gap-y-2", orientation === "vertical" && "flex-col", className)}
>
	{#each options as option (option)}
		{#if child}
			{@render child({ group, option })}
		{:else}
			<RadioGroupOption {group} {option} />
		{/if}
	{/each}
</svelte:element>
