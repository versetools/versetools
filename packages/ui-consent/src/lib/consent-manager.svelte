<script lang="ts" module>
	export type ConsentManagerProps = {
		consent: ConsentState<any>;
		"privacy-policy": string;
		style?: string | null;
	};

	let showConsentOptions = $state(false);

	export function openConsentOptions() {
		showConsentOptions = true;
	}
</script>

<script lang="ts">
	import type { ConsentState } from "@l3dev-private/consent-svelte";
	import { createDialog } from "@melt-ui/svelte";
	import { onMount } from "svelte";

	import OptionsDialog from "./options-dialog.svelte";
	import PopupDialog from "./popup-dialog.svelte";
	import { browser } from "$app/environment";

	let { consent, "privacy-policy": privacyPolicy, style }: ConsentManagerProps = $props();

	const popupDialog = createDialog({
		preventScroll: false,
		escapeBehavior: "ignore",
		closeOnOutsideClick: false,
		defaultOpen: browser && !consent.hasConsented
	});

	const optionsDialog = createDialog({
		preventScroll: false,
		escapeBehavior: "ignore",
		closeOnOutsideClick: true,
		defaultOpen: false
	});

	const { open: popupOpen } = popupDialog.states;
	const { open: optionsOpen } = optionsDialog.states;

	let dismissed = $state(false);

	$effect(() => {
		if (!consent.hasConsented && !$popupOpen && !$optionsOpen && !dismissed) {
			popupOpen.set(true);
			optionsOpen.set(false);
		}
	});

	$effect(() => {
		if (showConsentOptions) {
			showConsentOptions = false;
			popupOpen.set(false);
			optionsOpen.set(true);
		}
	});

	function dismiss() {
		dismissed = true;
		popupOpen.set(false);
		optionsOpen.set(false);
	}

	onMount(() => {
		window.addEventListener("consent-dismiss", dismiss);
		return () => {
			window.removeEventListener("consent-dismiss", dismiss);
		};
	});
</script>

<PopupDialog
	dialog={popupDialog}
	{optionsDialog}
	{consent}
	privacy-policy={privacyPolicy}
	{style}
/>
<OptionsDialog
	dialog={optionsDialog}
	{popupDialog}
	{consent}
	privacy-policy={privacyPolicy}
	{style}
/>
