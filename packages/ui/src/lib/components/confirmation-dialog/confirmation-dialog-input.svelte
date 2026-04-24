<script lang="ts" module>
	export type ConfirmationDialogInputProps = {
		label?: string | Snippet;
	} & InputProps<string>;
</script>

<script lang="ts">
	import type { Snippet } from "svelte";
	import { get } from "svelte/store";

	import { getConfirmationDialogContext } from "./context";
	import { Input, Label, type InputProps } from "../ui";
	import { getDialogContext } from "../ui/dialog/context";

	const ctx = getConfirmationDialogContext();

	let { id: overrideId, label, ...rest }: ConfirmationDialogInputProps = $props();

	const { dialog } = getDialogContext();
	const id = $derived(overrideId ?? `${get(dialog.ids.content)}-input`);
</script>

<div class="flex flex-col gap-1">
	{#if label}
		<Label for={id}>
			{#if typeof label === "string"}
				{label}
			{:else}
				{@render label()}
			{/if}
		</Label>
	{/if}
	<Input {id} size="sm" placeholder={ctx.confirmationInput} bind:value={ctx.inputValue} {...rest} />
</div>
