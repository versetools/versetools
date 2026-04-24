<script lang="ts" module>
	export type CheckboxProps = {
		class?: string;
		ref?: HTMLButtonElement | undefined;
	} & (
		| {
				value?: boolean;
				indeterminateWhen?: undefined;
				allowIndeterminate?: false;
		  }
		| {
				value?: boolean | "indeterminate";
				indeterminateWhen?: boolean;
				allowIndeterminate: true;
		  }
	) &
		Omit<HTMLButtonAttributes, "value">;
</script>

<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import MinusIcon from "@lucide/svelte/icons/minus";
	import XIcon from "@lucide/svelte/icons/x";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import { Checkbox as CheckboxBuilder } from "$lib/builders";

	let {
		id,
		name,
		class: className,
		value = $bindable(),
		indeterminateWhen,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		allowIndeterminate,
		ref = $bindable(),
		disabled,
		onclick,
		...rest
	}: CheckboxProps = $props();

	const checkbox = $derived(
		new CheckboxBuilder({
			indeterminateWhen,
			value,
			onValueChange(val) {
				value = val;
			},
			disabled: disabled ?? undefined
		})
	);
</script>

<input {...checkbox.hiddenInput} {id} {name} />
<button
	bind:this={ref}
	type="button"
	{...checkbox.trigger}
	{...rest}
	onclick={(e) => {
		e.stopPropagation();
		checkbox.trigger.onclick();
		onclick?.(e);
	}}
	class={twMerge(
		"group/checkbox bg-checkbox border-checkbox-border border-1 relative inline-flex aspect-square size-6 cursor-pointer items-center justify-center rounded-sm",
		checkbox.value && "bg-checkbox-on border-checkbox-on-border",
		className
	)}
>
	{#if checkbox.value === "indeterminate"}
		<MinusIcon class="text-text size-4" />
	{:else if checkbox.value}
		<CheckIcon class="text-text size-4" />
	{:else}
		<XIcon
			class="text-text-40 hidden size-4 group-hover/checkbox:block group-focus/checkbox:block"
		/>
	{/if}
	<span class="sr-only">Toggle</span>
</button>
