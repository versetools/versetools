<script lang="ts" module>
	export type PinInputProps = {
		class?: string;
		value?: string;
		disabled?: boolean;
		mask?: boolean;
	} & HTMLAttributes<HTMLDivElement>;
</script>

<script lang="ts">
	import { PinInput } from "melt/builders";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	let {
		id: _id,
		class: className,
		value = $bindable(),
		disabled,
		mask,
		...rest
	}: PinInputProps = $props();

	const pinInput = new PinInput({
		disabled,
		mask,
		placeholder: "",
		allowPaste: true,
		maxLength: 6,
		type: "numeric",
		value,
		onValueChange(val) {
			value = val;
		}
	});
</script>

<div {...rest} {...pinInput.root} class={twMerge("flex gap-3", className)}>
	{#each pinInput.inputs as input, i (i)}
		<input
			{...input}
			class={twMerge(
				"outline-hidden placeholder:text-input-placeholder text-(--input-text) bg-input border-input-border relative w-12 rounded-[6px] border px-1 py-3 text-center text-2xl font-medium"
				// (disabled || readonly) && "cursor-not-allowed"
			)}
		/>
	{/each}
</div>
