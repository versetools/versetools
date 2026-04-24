<script lang="ts">
	import type { Vendor } from "@l3dev-private/consent";
	import type { ConsentState } from "@l3dev-private/consent-svelte";
	import ExternalLinkIcon from "@lucide/svelte/icons/external-link";
	import { createDialog } from "@melt-ui/svelte";
	import { Accordion, Button, Card, Switch, Heading, Link } from "@versetools/ui";
	import { SvelteSet } from "svelte/reactivity";

	let {
		dialog,
		popupDialog,
		consent,
		"privacy-policy": privacyPolicy,
		style
	}: {
		dialog: ReturnType<typeof createDialog>;
		popupDialog: ReturnType<typeof createDialog>;
		consent: ConsentState<any>;
		"privacy-policy": string;
		style?: string | null;
	} = $props();

	const { portalled, content, title, description } = dialog.elements;
	const { open } = dialog.states;

	const selectedConsents = new SvelteSet(consent.consents ?? []);
	$effect(() => {
		selectedConsents.clear();
		for (const vendor of consent.consents ?? []) {
			selectedConsents.add(vendor);
		}
	});
</script>

{#if $open}
	<div
		{...$portalled}
		use:portalled
		class="bg-background/50 fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center px-4 pb-4"
		{style}
	>
		<div {...$content} use:content class="w-full max-w-lg">
			<Card size="full">
				<Card.Header class="@xs:justify-end flex-row justify-center gap-4">
					<Button
						size="sm"
						variant="ghost"
						onclick={() => {
							open.set(false);
							consent.rejectAll();
						}}
					>
						Reject all
					</Button>
					<Button
						size="sm"
						onclick={() => {
							open.set(false);
							consent.acceptAll();
						}}
					>
						Accept all
					</Button>
				</Card.Header>
				<Card.Body class="gap-4 px-4 pt-2">
					<div>
						<Heading as="h2" size="sm" element={title}>Privacy Options</Heading>
						<p {...$description} use:description class="text-text-80 mt-1 text-sm font-medium">
							Find out below how we use cookies and the partners and services we work with. By using
							our services, you agree to our use of cookies. To learn more, <Link
								href={privacyPolicy}
								target="_blank"
							>
								read our Privacy Policy
							</Link>.
						</p>
					</div>
					<Accordion>
						{#snippet children(accordion)}
							{#each Object.keys(consent.vendors) as vendor (vendor)}
								{@const vendorData = consent.vendors[vendor] as Vendor}
								<Accordion.Item {accordion} button-class="px-2 py-3" content-class="pt-2 text-sm">
									{#snippet heading()}
										<Switch
											class="mr-2"
											bind:value={
												() => selectedConsents.has(vendor),
												(v) => {
													if (v) {
														selectedConsents.add(vendor);
													} else {
														selectedConsents.delete(vendor);
													}
												}
											}
										/>
										<span class="text-sm">{vendorData.name}</span>
									{/snippet}
									<div class="flex items-center gap-3">
										<span class="font-medium">Privacy Policy:</span>
										<Button
											href={vendorData.privacyPolicyUrl}
											target="_blank"
											Icon={ExternalLinkIcon}
											icon-class="size-4"
											icon-align="right"
											variant="outline"
											size="xs"
											corners="none small"
										>
											{vendorData.name}
										</Button>
									</div>
									<div class="bg-border my-2 h-px w-full"></div>
									<p class="text-xs font-normal">{vendorData.description}</p>
								</Accordion.Item>
							{/each}
						{/snippet}
					</Accordion>
					<div class="flex justify-end gap-4">
						<Button
							size="sm"
							variant="ghost"
							onclick={() => {
								open.set(false);

								selectedConsents.clear();
								for (const vendor of consent.consents ?? []) {
									selectedConsents.add(vendor);
								}

								if (!consent.hasConsented) {
									popupDialog.states.open.set(true);
								}
							}}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onclick={() => {
								open.set(false);
								consent.accept(selectedConsents.values().toArray());
							}}
						>
							Save choices
						</Button>
					</div>
				</Card.Body>
			</Card>
		</div>
	</div>
{/if}
