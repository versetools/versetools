<script lang="ts" module>
	export type PageLayoutProps = {
		fm: Record<string, any>;
		heroImage?: Snippet;
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { tick, type Snippet } from "svelte";
	import siteConfig from "virtual:sveltepress/site";
	import themeOptions from "virtual:sveltepress/theme";

	import EditPage from "./EditPage.svelte";
	import HeroImage from "./home/HeroImage.svelte";
	import Home from "./Home.svelte";
	import LastUpdate from "./LastUpdate.svelte";
	import { anchors, pages, showToc, showHeader, showLayout, sidebar } from "./layout";
	import Link from "./Link.svelte";
	import PageSwitcher from "./PageSwitcher.svelte";
	import Toc from "./Toc.svelte";

	import { afterNavigate, beforeNavigate } from "$app/navigation";
	import { page } from "$app/state";

	const routeId = $derived(page.route.id);

	// The frontmatter info. This would be injected by sveltepress
	const { fm, children, heroImage }: PageLayoutProps = $props();

	// svelte-ignore state_referenced_locally
	const {
		pageType,
		lastUpdate,
		anchors: fmAnchors = [],
		sidebar: fmSidebar = true,
		header = true,
		layout = true,
		home: fmHome,
		toc: fmToc
	} = fm;

	$sidebar = fmSidebar;
	$showToc = fmHome !== true && fmToc !== false;
	$showHeader = header;
	$showLayout = layout;

	anchors.set(fmAnchors);

	const isHome = $derived(routeId === "/" && fmHome !== false);

	let ready = $state(false);

	beforeNavigate(() => {
		ready = false;
	});

	afterNavigate(() => {
		tick().then(() => {
			ready = true;
		});
	});
</script>

<svelte:head>
	<title>{fm.title ? `${fm.title} - ${siteConfig.title}` : siteConfig.title}</title>
	<meta name="description" content={fm.description || siteConfig.description} />
</svelte:head>

{#if layout === false}
	{@render children?.()}
{:else}
	{#snippet defaultHeroImage()}
		{#if fm.heroImage}
			<HeroImage heroImage={fm.heroImage} />
		{/if}
	{/snippet}
	{#if isHome || fmHome === true}
		<div class:no-toc={!$showToc} class:content={!isHome} class:theme--page-layout={!isHome}>
			<Home isHomepage={isHome} {...fm} {siteConfig} heroImage={heroImage ?? defaultHeroImage}>
				{@render children?.()}
				{#if fm.meta}
					<div class="meta" class:without-edit-link={!themeOptions.editLink}>
						{#if themeOptions.editLink}
							<EditPage {pageType} />
						{/if}
						<LastUpdate {lastUpdate} />
					</div>
				{/if}
				{#if themeOptions.footer}
					<div class="footer">
						<div class="copyright">
							© {new Date().getFullYear()}
							{themeOptions.footer.copyright}
						</div>
						{#each themeOptions.footer.links as link (link)}
							<Link {...link} />
						{/each}
					</div>
				{/if}
			</Home>
		</div>
	{:else}
		<div class="theme--page-layout pb-4">
			<div class="content" class:no-toc={!$showToc}>
				{#if fm.title}
					<h1 class="page-title">
						{fm.title}
					</h1>
				{/if}
				{@render children?.()}
				<div class="meta" class:without-edit-link={!themeOptions.editLink}>
					{#if themeOptions.editLink}
						<EditPage {pageType} />
					{/if}
					<LastUpdate {lastUpdate} />
				</div>
				{#if ready && $pages.length}
					<PageSwitcher />
				{/if}
				{#if themeOptions.footer}
					<div class="footer">
						<div class="copyright">
							© {new Date().getFullYear()}
							{themeOptions.footer.copyright}
						</div>
						{#each themeOptions.footer.links as link (link)}
							<Link {...link} />
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
{/if}

{#if $showToc}
	<Toc anchors={$anchors} />
{/if}

<style>
	.content {
		--at-apply: "sm:w-[45vw] mx-auto pb-8 sm:pb-28 w-[90vw]";
	}
	.content.no-toc {
		--at-apply: "sm:w-[60vw] sm:pl-[15vw]";
	}
	.page-title {
		--at-apply: "mt-none";
	}
	.meta {
		--at-apply: "sm:flex justify-between mt-20 column";
	}
	.without-edit-link {
		--at-apply: "justify-end";
	}

	.footer {
		--at-apply: "flex gap-4 text-[14px] mt-12";
	}
	.copyright {
		--at-apply: "text-gray-5 dark:text-gray-4";
	}
</style>
