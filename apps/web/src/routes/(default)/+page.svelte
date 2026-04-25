<script lang="ts">
	import ExternalLinkIcon from "@lucide/svelte/icons/external-link";
	import config from "@versetools/config";
	import { Button, Card } from "@versetools/ui";

	import { Meta } from "$lib/components/meta";
</script>

<Meta />

<Button href={config.socials.discord} size="lg" variant="outline" class="px-8 py-3">
	Join our Discord
</Button>
<h2 class="sr-only">Services</h2>
<section class="mt-8 flex w-full justify-center">
	<!-- {#each Object.values(config.services) as service (service.name)}
		<Card
			as="a"
			href={service.url}
			variant="secondary"
			class="transition-opacity hover:opacity-90"
		>
			<div class="w-full overflow-hidden rounded-t-[6px]">
				<img
					src={service.thumbnail}
					alt=""
					class="transition-transform duration-500 group-hover/card:scale-105"
				/>
			</div>
			<ExternalLinkIcon class="absolute top-3 right-3 size-6" />
			<Card.Header>
				<Card.Title class="text-2xl">{service.name}</Card.Title>
				<Card.Description class="text-text-80">
					{service.description}
				</Card.Description>
			</Card.Header>
		</Card>
	{/each} -->
</section>
