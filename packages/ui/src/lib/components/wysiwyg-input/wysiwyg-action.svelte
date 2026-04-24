<script lang="ts">
	import type { Component } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import Tooltip from "../ui/tooltip.svelte";

	let {
		title,
		Icon,
		strokeWidth = 2.5,
		class: className,
		...rest
	}: {
		title: string;
		Icon: Component<{ class?: string; strokeWidth?: string | number }>;
		strokeWidth?: string | number;
		class?: string;
	} & HTMLButtonAttributes = $props();
</script>

<Tooltip placement="top" corners="none" class="py-0.5">
	{#snippet trigger(props)}
		<button
			type="button"
			{...props}
			{...rest}
			class={twMerge(
				"text-text-60 bg-text/0 hover:bg-text/5 cursor-pointer rounded-md p-2",
				className
			)}
		>
			<Icon class="size-4" {strokeWidth} />
		</button>
	{/snippet}
	<span class="text-sm">{title}</span>
</Tooltip>
