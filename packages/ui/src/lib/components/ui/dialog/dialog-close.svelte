<script lang="ts" module>
	export type DialogCloseProps = {
		inline?: boolean;
	} & ButtonProps;
</script>

<script lang="ts">
	import XIcon from "@lucide/svelte/icons/x";
	import { twMerge } from "tailwind-merge";

	import Button, { type ButtonProps } from "../button.svelte";
	import { getDialogContext } from "./context";

	let { class: className, inline = false, children, ...rest }: DialogCloseProps = $props();

	const { dialog } = getDialogContext();

	const { close } = dialog.elements;
</script>

<Button
	variant="ghost"
	size="icon"
	corners="none"
	{...rest}
	element={close}
	class={twMerge(!inline && "absolute top-2 right-2", className)}
>
	{#if children}
		{@render children?.()}
	{:else}
		<XIcon class="size-5" />
	{/if}
</Button>
