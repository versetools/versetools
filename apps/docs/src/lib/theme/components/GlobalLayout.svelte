<script lang="ts" module>
	export type GlobalLayoutProps = {
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { onMount, setContext, type Component, type Snippet } from "svelte";
	import themeOptions from "virtual:sveltepress/theme";

	import { SVELTEPRESS_CONTEXT_KEY } from "../context";
	import AjaxBar from "./AjaxBar.svelte";
	import Backdrop from "./Backdrop.svelte";
	import Error from "./Error.svelte";
	import GoogleAnalytics from "./GoogleAnalytics.svelte";
	import {
		isDark,
		navCollapsed,
		oldScrollY,
		resolveSidebar,
		scrollY,
		showHeader,
		showLayout,
		sidebar,
		sidebarCollapsed
	} from "./layout";
	import Navbar from "./Navbar.svelte";
	import Sidebar from "./Sidebar.svelte";

	import { afterNavigate, beforeNavigate } from "$app/navigation";
	import { page } from "$app/state";
	import "virtual:uno.css";
	import "../style.css";

	const { children, ...rest }: GlobalLayoutProps = $props();

	setContext(SVELTEPRESS_CONTEXT_KEY, {
		isDark
	});

	resolveSidebar(page.route.id!);

	let ajaxBar = $state<ReturnType<typeof AjaxBar> | undefined>();

	beforeNavigate(() => {
		ajaxBar?.start();
	});

	afterNavigate(() => {
		ajaxBar?.end();
		$sidebarCollapsed = true;
		$navCollapsed = true;
	});

	let pwaComponent = $state<Component | undefined>();

	onMount(async () => {
		if (themeOptions.pwa) pwaComponent = (await import("./pwa/Pwa.svelte")).default;
	});

	// svelte-ignore state_referenced_locally
	void rest;
</script>

<svelte:window onscroll={() => ($oldScrollY = $scrollY)} bind:scrollY={$scrollY} />

{#if $showHeader}
	<Navbar />
{/if}
{#if page.error}
	<Error error={page.error} />
{:else if $showLayout === false}
	{@render children?.()}
{:else}
	<main class:without-header={$showHeader === false}>
		<AjaxBar bind:this={ajaxBar} />
		{#if $sidebar}
			<Sidebar />
		{/if}
		<Backdrop
			show={!$navCollapsed}
			top="56px"
			zIndex={887}
			onClose={() => ($navCollapsed = true)}
		/>
		{@render children?.()}

		<GoogleAnalytics />

		{#if pwaComponent}
			{@const SvelteComponent = pwaComponent}
			<SvelteComponent />
		{/if}
	</main>
{/if}

<style>
	main {
		--at-apply: "pt-[76px] sm:pt-[73px]";
	}
	main.without-header {
		--at-apply: "pt-0";
	}
</style>
