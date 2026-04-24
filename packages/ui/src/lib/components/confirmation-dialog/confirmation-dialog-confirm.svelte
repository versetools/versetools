<script lang="ts" module>
	export type ConfirmationDialogConfirmProps = BaseButtonProps & HTMLButtonAttributes;
</script>

<script lang="ts">
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import { Button, type BaseButtonProps } from "../ui";
	import { getConfirmationDialogContext } from "./context";

	const ctx = getConfirmationDialogContext();

	let {
		class: className,
		variant = ctx.variant === "destructive" ? "destructive" : "primary",
		size = "sm",
		disabled,
		onclick,
		children,
		...rest
	}: ConfirmationDialogConfirmProps = $props();

	const canConfirm = $derived(!(ctx.confirmationInput && ctx.inputValue !== ctx.confirmationInput));
</script>

<Button
	{...rest}
	class={twMerge("flex-1 justify-center", className)}
	{variant}
	{size}
	disabled={disabled || ctx.closing || !canConfirm}
	onclick={async (e: any) => {
		if (disabled || ctx.closing || !canConfirm) return;
		ctx.closing = true;
		ctx.inputValue = "";

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
		Confirm
	{/if}
</Button>
