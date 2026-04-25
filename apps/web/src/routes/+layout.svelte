<script lang="ts">
	import "../app.css";
	import config from "@versetools/config";
	import { ConfirmationDialog, Toaster } from "@versetools/ui";
	import { smoothScrolling } from "@versetools/ui/helpers";
	import { ConsentManager } from "@versetools/ui-consent";
	import { onMount } from "svelte";

	import { PUBLIC_CONVEX_URL } from "$env/static/public";

	import type { LayoutProps } from "./$types";

	import emblem from "$lib/assets/emblem.png";
	import logo from "$lib/assets/logo.png";
	import { AppSchema } from "$lib/components/meta";
	import { useUnsavedChanges } from "$lib/runes";
	import { consent, posthog } from "$lib/states";

	let { children }: LayoutProps = $props();

	// createSvelteAuthClient({
	// 	authClient,
	// 	convexUrl: PUBLIC_CONVEX_URL,
	// 	options: {
	// 		logger: false
	// 	}
	// });
	consent.init();
	posthog.init();

	const unsavedChanges = useUnsavedChanges();

	onMount(() => {
		for (const a of document.querySelectorAll<HTMLAnchorElement>("a:not([data-smooth-scrolling]")) {
			const smoothScrollingProps = smoothScrolling(a.href);
			if (!smoothScrollingProps.onclick) continue;

			a.dataset.smoothScrolling = smoothScrollingProps["data-smooth-scrolling"];
			a.addEventListener("click", (e) => smoothScrollingProps.onclick(e as any));
		}
	});
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
	<link rel="preload" href={emblem} as="image" />
	<link rel="preload" href={logo} as="image" />
	<AppSchema />
</svelte:head>

<div class="flex h-full min-h-screen flex-col">
	{@render children()}
</div>
<ConsentManager {consent} privacy-policy={config.policies.privacy} />
<Toaster />

{#if unsavedChanges.unsaved}
	<ConfirmationDialog
		title="Do you want to leave?"
		description="It looks like you have unsaved changes. Are you sure you want to leave?"
		closeOnOutsideClick
		onOutsideClick={() => unsavedChanges.canNavigate(false)}
		bind:open={unsavedChanges.unsaved}
	>
		<ConfirmationDialog.Cancel onclick={() => unsavedChanges.canNavigate(false)}>
			Cancel
		</ConfirmationDialog.Cancel>
		<ConfirmationDialog.Confirm onclick={() => unsavedChanges.canNavigate(true)}>
			Leave
		</ConfirmationDialog.Confirm>
	</ConfirmationDialog>
{/if}
