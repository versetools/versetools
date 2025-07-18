<script lang="ts">
	import "../app.css";
	import { Toaster } from "@versetools/ui";
	import { smoothScrolling } from "@versetools/ui/helpers";
	import { ConsentManager } from "@versetools/ui-consent";
	import posthogjs from "posthog-js";
	import { onMount, type Snippet } from "svelte";

	import { PUBLIC_POSTHOG_KEY } from "$env/static/public";
	import { AppSchema } from "$lib/seo/schema";
	import { consent } from "$lib/states";

	import type { LayoutData } from "./$types";

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
	consent.init(data.consent);

	let posthogLoaded = $state(false);
	function loadPosthog() {
		posthogLoaded = true;
		posthogjs.init(PUBLIC_POSTHOG_KEY, {
			api_host: "https://prod-events.l3.dev",
			ui_host: "https://eu.i.posthog.com",
			person_profiles: "always",
			capture_exceptions: true,
			disable_surveys: false
		});
	}

	$effect(() => {
		if (!posthogLoaded && consent.isEnabled("posthog")) {
			loadPosthog();
		}
	});

	onMount(() => {
		for (const a of document.querySelectorAll<HTMLAnchorElement>("a:not([data-smooth-scrolling]")) {
			const smoothScrollingProps = smoothScrolling(a.href);
			if (!smoothScrollingProps.onclick) continue;

			a.dataset.smoothScrolling = smoothScrollingProps["data-smooth-scrolling"];
			a.addEventListener("click", (e) =>
				smoothScrollingProps.onclick(
					e as MouseEvent & {
						currentTarget: EventTarget & HTMLAnchorElement;
					}
				)
			);
		}
	});
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
	<AppSchema />
</svelte:head>

<div class="flex h-full min-h-screen flex-col tracking-[0.05em]">
	{@render children()}
</div>
<ConsentManager
	{consent}
	privacy-policy="/privacy-policy"
	style="--color-card: var(--color-background);"
/>
<Toaster />
