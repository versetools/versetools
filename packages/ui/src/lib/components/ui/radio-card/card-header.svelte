<script lang="ts" module>
	export type RadioCardHeaderProps = CardHeaderProps;
</script>

<script lang="ts">
	import { twMerge } from "tailwind-merge";

	import { getRadioCardContext } from "./context";
	import CardHeader, { type CardHeaderProps } from "../card/card-header.svelte";

	let { class: className, children, ...rest }: RadioCardHeaderProps = $props();

	const { item } = getRadioCardContext();
</script>

<CardHeader {...rest} class={twMerge("flex-row justify-between", className)}>
	{@render children?.()}
	<div
		class={twMerge(
			"border-1 border-input-border bg-input grid size-5 place-items-center rounded-full",
			item.checked && "border-radio-active-border"
		)}
	>
		{#if item.checked}
			<div
				class={["size-3 rounded-full", item.checked && "bg-radio-active-dot"]}
				aria-hidden="true"
			></div>
		{/if}
	</div>
</CardHeader>
