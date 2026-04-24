<script lang="ts" module>
	export type SwitchProps = {
		class?: string;
		value?: boolean;
		ref?: HTMLButtonElement | undefined;
	} & Omit<HTMLButtonAttributes, "value">;
</script>

<script lang="ts">
	import { Toggle } from "melt/builders";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	let {
		id,
		name,
		class: className,
		value = $bindable(),
		ref = $bindable(),
		disabled,
		onclick,
		...rest
	}: SwitchProps = $props();

	const toggle = $derived(
		new Toggle({
			value,
			onValueChange(val) {
				value = val;
			},
			disabled: disabled ?? undefined
		})
	);
</script>

<input {...toggle.hiddenInput} {id} {name} />
<button
	bind:this={ref}
	type="button"
	{...toggle.trigger}
	{...rest}
	onclick={(e) => {
		e.stopPropagation();
		toggle.trigger.onclick();
		onclick?.(e);
	}}
	class={twMerge(
		"bg-switch border-switch-border relative h-6 w-12 shrink-0 cursor-pointer rounded-full border-1",
		toggle.value && "bg-switch-on border-switch-on-border",
		className
	)}
>
	<div
		class={twMerge(
			"absolute top-0.75 size-4 rounded-full bg-white transition-transform",
			toggle.value ? "translate-x-6.75" : "translate-x-0.75"
		)}
	></div>
	<span class="sr-only">Toggle</span>
</button>
