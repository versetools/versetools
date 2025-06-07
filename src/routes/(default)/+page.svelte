<script lang="ts">
	import { Button, Card } from "@versetools/ui";
	import { ExternalLinkIcon } from "lucide-svelte";

	import { config } from "$lib/config";
	import Meta from "$lib/seo/meta.svelte";
</script>

<Meta />

<Button href={config.socials.discord} size="lg" variant="outline" class="px-8 py-3">
	Join our Discord
</Button>
<h2 class="sr-only">Services</h2>
<section class="mt-8 flex w-full justify-center">
	{#each Object.values(config.services) as product (product.name)}
		<Card
			tag="a"
			href={product.url}
			variant="secondary"
			class="transition-opacity hover:opacity-90"
		>
			<div class="w-full overflow-hidden rounded-t-[6px]">
				<img
					src={product.thumbnail}
					alt=""
					class="transition-transform duration-500 group-hover/card:scale-105"
				/>
			</div>
			<ExternalLinkIcon class="absolute top-3 right-3 size-6" />
			<Card.Header>
				<Card.Title class="text-2xl">{product.name}</Card.Title>
				<Card.Description class="text-text-80">
					{product.description}
				</Card.Description>
			</Card.Header>
		</Card>
	{/each}
</section>
