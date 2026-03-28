<script lang="ts">
	import { config } from "@versetools/core/config";

	import { metaConfig } from "$config/meta";
	import { schemaConfig } from "$config/schema";
	import { PUBLIC_SITE_URL } from "$env/static/public";

	import Schema from "./Schema.svelte";
</script>

<Schema
	data={{
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: config.name,
		description: metaConfig.description,
		url: PUBLIC_SITE_URL,
		author: schemaConfig.creator,
		datePublished: schemaConfig.publishDate,
		applicationCategory: schemaConfig.appCategory
	}}
/>
