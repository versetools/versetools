<script lang="ts" module>
	export type MetaProps = {
		sitename?: string;
		title?: string;
		description?: string;
		favicon?: string;
		image?: string;
		titleSide?: "left" | "right";
		imageSize?: "small" | "large";
		imageDimensions?: { width: number; height: number };
		type?: "website" | "article";
		children?: Snippet;
	};
</script>

<script lang="ts">
	import config from "@versetools/config";
	import type { Snippet } from "svelte";

	import { dev } from "$app/environment";

	import { metaConfig } from "$config/meta";

	const emblem =
		metaConfig.emblem && dev ? `http://localhost:5173${metaConfig.emblem}` : metaConfig.emblem;
	const thumbnail =
		metaConfig.thumbnail && dev
			? `http://localhost:5173${metaConfig.thumbnail}`
			: metaConfig.thumbnail;

	let {
		sitename = config.name,
		title,
		description,
		favicon = "/favicon.png",
		image,
		titleSide = "left",
		imageSize = !image && thumbnail ? "large" : "small",
		imageDimensions = !image && thumbnail ? { width: 1600, height: 838 } : undefined,
		type = "website",
		children
	}: MetaProps = $props();

	const titleWithSiteName = $derived(
		title ? (titleSide === "left" ? `${title} | ${sitename}` : `${sitename} | ${title}`) : sitename
	);
	const descriptionOrDefault = $derived(description ? description : metaConfig.description);
	const imageOrDefault = $derived(image ? image : (thumbnail ?? emblem));
</script>

<svelte:head>
	<title>{titleWithSiteName}</title>
	{#if favicon}
		<link rel="icon" href={favicon} />
	{/if}
	<meta name="application-name" content={sitename} />
	<meta name="theme-color" content={metaConfig.color} />
	<meta name="msapplication-TileColor" content={metaConfig.color} />
	<meta name="msapplication-TileImage" content={emblem} />
	<meta name="description" content={descriptionOrDefault} />
	<meta name="keywords" content={metaConfig.keywords.join(", ")} />
	<meta property="og:title" content={titleWithSiteName} />
	<meta property="og:description" content={descriptionOrDefault} />
	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={sitename} />
	<meta property="og:image" content={imageOrDefault} />
	{#if imageDimensions}
		<meta property="og:image:width" content={imageDimensions.width.toString()} />
		<meta property="og:image:height" content={imageDimensions.height.toString()} />
	{/if}
	{#if imageSize === "large"}
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
	{#if metaConfig.twitterHandle}
		<meta name="twitter:creator" content={metaConfig.twitterHandle} />
	{/if}
	{#if children}
		{@render children()}
	{/if}
</svelte:head>
