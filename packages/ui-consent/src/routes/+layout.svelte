<script lang="ts">
	import "../app.css";

	import { ConsentManager } from "$lib";

	import type { LayoutProps } from "./$types";
	import { consent } from "./state";

	let { children }: LayoutProps = $props();

	consent.init();
	console.log(consent.consents);
</script>

<svelte:head>
	<title>Consent | Versetools UI</title>
</svelte:head>

{@render children()}
<ConsentManager privacy-policy="/" {consent} />
