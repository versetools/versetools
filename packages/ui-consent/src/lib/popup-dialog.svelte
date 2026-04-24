<script lang="ts">
	import type { ConsentState } from "@l3dev-private/consent-svelte";
	import { createDialog } from "@melt-ui/svelte";
	import { Button, Card, Link } from "@versetools/ui";

	let {
		dialog,
		optionsDialog,
		consent,
		"privacy-policy": privacyPolicy,
		style
	}: {
		dialog: ReturnType<typeof createDialog>;
		optionsDialog: ReturnType<typeof createDialog>;
		consent: ConsentState<any>;
		"privacy-policy": string;
		style?: string | null;
	} = $props();

	const { portalled, content, title, description } = dialog.elements;
	const { open } = dialog.states;
</script>

{#if $open}
	<div
		{...$portalled}
		use:portalled
		class="fixed bottom-0 right-0 z-50 w-full max-w-lg px-4 pb-4"
		{style}
	>
		<div {...$content} use:content class="w-full max-w-lg">
			<Card size="full">
				<Card.Body class="gap-2">
					<h2 {...$title} use:title class="sr-only">Consent to use cookies</h2>
					<p {...$description} use:description class="text-text-80 text-sm font-medium">
						We use cookies to help us understand how you use our services and to improve your
						experience. By using our services, you agree to our use of cookies. <Link
							href={privacyPolicy}
						>
							Read our Privacy Policy
						</Link>
					</p>
					<div class="flex gap-4">
						<Button
							size="sm"
							onclick={() => {
								open.set(false);
								consent.acceptAll();
							}}
						>
							Accept all
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onclick={async () => {
								open.set(false);
								optionsDialog.states.open.set(true);
							}}
						>
							View options
						</Button>
						<Button
							size="sm"
							onclick={async () => {
								open.set(false);
								consent.rejectAll();
							}}
						>
							Essential only
						</Button>
					</div>
				</Card.Body>
			</Card>
		</div>
	</div>
{/if}
