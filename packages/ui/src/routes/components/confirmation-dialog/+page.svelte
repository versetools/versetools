<script lang="ts">
	import { Button, ConfirmationDialog } from "$lib";

	import Preview from "../_components/preview.svelte";

	let defaultOpen = $state(false);
	let destructiveOpen = $state(false);
	let inputOpen = $state(false);
</script>

<Preview title="Confirmation Dialog">
	<Button onclick={() => (defaultOpen = true)}>Open default confirmation</Button>
	<ConfirmationDialog
		title="You have unsaved changes"
		description="Are you sure you want to leave?"
		bind:open={defaultOpen}
	>
		<ConfirmationDialog.Cancel />
		<ConfirmationDialog.Confirm />
	</ConfirmationDialog>

	<Button onclick={() => (destructiveOpen = true)}>Open destructive confirmation</Button>
	<ConfirmationDialog
		variant="destructive"
		title="Confirm account deletion"
		description="This will permanently delete your account from our system. This action cannot be undone."
		bind:open={destructiveOpen}
	>
		<ConfirmationDialog.Cancel>Wait, go back</ConfirmationDialog.Cancel>
		<ConfirmationDialog.Confirm class="flex-none">Delete my account</ConfirmationDialog.Confirm>
	</ConfirmationDialog>

	<Button onclick={() => (inputOpen = true)}>Open input confirmation</Button>
	<ConfirmationDialog
		size="md"
		variant="destructive"
		title="Are you sure?"
		confirmationInput="Versetools"
		showClose
		closeOnOutsideClick
		bind:open={inputOpen}
	>
		{#snippet description()}
			<span class="text-text font-normal">
				This action cannot be undone. This will delete the <strong>Versetools</strong> organisation along
				with all associated data.
			</span>
		{/snippet}
		{#snippet confirmationInputLabel()}
			<span class="font-normal">Please type <strong>Versetools</strong> to confirm:</span>
		{/snippet}
		<ConfirmationDialog.Confirm>Delete the organisation</ConfirmationDialog.Confirm>
	</ConfirmationDialog>
</Preview>
