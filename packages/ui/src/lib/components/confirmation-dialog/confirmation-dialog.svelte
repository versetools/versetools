<script lang="ts" module>
	import type { CreateDialogProps } from "@melt-ui/svelte";

	export type ConfirmationDialogProps = {
		title: string | Snippet;
		titleClass?: string;
		description?: string | Snippet;
		descriptionClass?: string;
		open?: boolean;
		defaultOpen?: boolean;
		showClose?: boolean;
		confirmationInputLabel?: string | Snippet;
		confirmationInput?: string;
		variant?: "primary" | "secondary" | "destructive";
		size?: "lg" | "sm" | "md" | "full" | "xl";
		children?: Snippet;
	} & Omit<CreateDialogProps, "open">;
</script>

<script lang="ts">
	import type { Snippet } from "svelte";
	import { twMerge } from "tailwind-merge";

	import { Dialog } from "../ui";
	import ConfirmationDialogInput from "./confirmation-dialog-input.svelte";
	import { setConfirmationDialogContext } from "./context";

	let {
		title,
		titleClass,
		description,
		descriptionClass,
		open = $bindable(),
		showClose,
		confirmationInputLabel,
		confirmationInput,
		variant = "primary",
		size = "sm",
		children,
		...rest
	}: ConfirmationDialogProps = $props();

	let closing = $state(false);
	let inputValue = $state("");

	setConfirmationDialogContext({
		get variant() {
			return variant;
		},
		get confirmationInput() {
			return confirmationInput;
		},
		get inputValue() {
			return inputValue;
		},
		set inputValue(v) {
			inputValue = v;
		},
		get open() {
			return open;
		},
		set open(v) {
			open = v;
		},
		get closing() {
			return closing;
		},
		set closing(v) {
			closing = v;
		}
	});
</script>

<Dialog.Portal closeOnOutsideClick={false} {...rest} bind:open>
	<Dialog.Overlay />
	<Dialog
		{variant}
		{size}
		data-closing={closing}
		data-open={open}
		data-confirmation-input={confirmationInput}
	>
		<Dialog.Header class="gap-2">
			<Dialog.Title class={twMerge(showClose && "pr-7", titleClass)}>
				{#if typeof title === "string"}
					{title}
				{:else}
					{@render title()}
				{/if}
			</Dialog.Title>
			{#if description}
				<Dialog.Description class={twMerge("flex flex-col gap-4", descriptionClass)}>
					{#if typeof description === "string"}
						{description}
					{:else}
						{@render description()}
					{/if}
				</Dialog.Description>
			{/if}
			{#if showClose}
				<Dialog.Close />
			{/if}
		</Dialog.Header>
		<Dialog.Body>
			{#if confirmationInput}
				<ConfirmationDialogInput label={confirmationInputLabel} />
			{/if}
			<div class="flex flex-row justify-between gap-4">
				{@render children?.()}
			</div>
		</Dialog.Body>
	</Dialog>
</Dialog.Portal>
