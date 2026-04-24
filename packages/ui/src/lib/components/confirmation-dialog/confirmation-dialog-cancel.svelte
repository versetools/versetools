<script lang="ts" module>
	export type ConfirmationDialogCancelProps = BaseButtonProps & HTMLButtonAttributes;
</script>

<script lang="ts">
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import { Button, type BaseButtonProps } from "../ui";
	import { getConfirmationDialogContext } from "./context";

	let {
		class: className,
		variant = "ghost",
		size = "sm",
		disabled,
		onclick,
		children,
		...rest
	}: ConfirmationDialogCancelProps = $props();

	const ctx = getConfirmationDialogContext();
</script>

<Button
	{...rest}
	class={twMerge("flex-1 justify-center", className)}
	{variant}
	{size}
	disabled={disabled || ctx.closing}
	onclick={async (e: any) => {
		if (disabled || ctx.closing) return;
		ctx.closing = true;

		try {
			await onclick?.(e);
		} finally {
			ctx.open = false;
			ctx.closing = false;
		}
	}}
>
	{#if children}
		{@render children()}
	{:else}
		Cancel
	{/if}
</Button>
