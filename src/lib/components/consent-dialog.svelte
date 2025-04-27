<script lang="ts">
	import { createDialog } from "@melt-ui/svelte";
	import { Button, Card } from "@versetools/ui";
	import { onMount } from "svelte";

	import { consent } from "$lib/states";
	import { api } from "$routes/api";

	const dialog = createDialog({
		preventScroll: false,
		escapeBehavior: "ignore",
		closeOnOutsideClick: false,
		defaultOpen: consent.value === null
	});

	const { portalled, content, title, description } = dialog.elements;
	const { open } = dialog.states;

	let consenting = $state(false);
	let dismissed = $state(false);

	$effect(() => {
		if (consent.value === null && !$open && !consenting && !dismissed) {
			open.set(true);
		}
	});

	async function setConsent(choice: "accept" | "reject") {
		consenting = true;
		open.set(false);

		const response = await api.request(api.v1.consent, {
			method: "POST",
			input: {
				choice
			}
		});

		if (!response.ok) {
			throw new Error("Failed to set consent", { cause: response });
		}

		consent.value = response.value;
		consenting = false;
	}

	function dismiss() {
		dismissed = true;
		open.set(false);
	}

	onMount(() => {
		window.addEventListener("consent-dismiss", dismiss);
		return () => {
			window.removeEventListener("consent-dismiss", dismiss);
		};
	});
</script>

{#if $open}
	<div {...$portalled} use:portalled class="fixed right-0 bottom-0 z-50 w-full max-w-lg px-4 pb-4">
		<div {...$content} use:content class="w-full max-w-lg">
			<Card size="full">
				<Card.Body class="gap-2">
					<h2 {...$title} use:title class="sr-only">Consent to use cookies</h2>
					<p {...$description} use:description class="text-text-80 text-sm font-medium">
						We use cookies to help us understand how you use our services and to improve your
						experience. By using our services, you agree to our use of cookies. <a
							href="/privacy-policy"
							class="text-text-link hover:underline">Read our Privacy Policy</a
						>
					</p>
					<div class="flex gap-4">
						<Button size="sm" onclick={() => setConsent("accept")}>Accept</Button>
						<Button size="sm" variant="ghost" onclick={() => setConsent("reject")}>Reject</Button>
					</div>
				</Card.Body>
			</Card>
		</div>
	</div>
{/if}
