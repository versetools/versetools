<script lang="ts">
	import "../app.css";
	import { Toaster } from "@versetools/ui";
	import { smoothScrolling } from "@versetools/ui/helpers";
	import posthogjs from "posthog-js";
	import { onMount, type Snippet } from "svelte";

	import { PUBLIC_POSTHOG_KEY } from "$env/static/public";
	import ConsentDialog from "$lib/components/consent-dialog.svelte";
	import { AppSchema } from "$lib/seo/schema";
	import { consent } from "$lib/states";

	import type { LayoutData } from "./$types";

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
	consent.value = data.consent;

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
		if (!posthogLoaded && consent.value?.analytics) {
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
</svelte:head>
<AppSchema />

<div class="flex h-full min-h-screen flex-col tracking-[0.05em]">
	{@render children()}
</div>
<ConsentDialog />
<Toaster />
