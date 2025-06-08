<script lang="ts">
	import { Card } from "@versetools/ui";

	import Meta from "$lib/seo/meta.svelte";

	type DataRequest = {
		name: string;
		description: string;
		href: string;
	};

	const requests = [
		{
			name: "Download",
			description: "Get a report of your personal data we have collected for all of our services",
			href: "/data-request/download"
		},
		{
			name: "Delete",
			description: "Delete your personal data from our systems where applicable",
			href: "/data-request/delete"
		},
		{
			name: "Restrict Processing",
			description:
				"Ask us to stop processing your personal data for certain purposes (e.g. legitimate interests and direct marketing) where applicable",
			href: "/data-request/restrict-processing"
		},
		{
			name: "Correct Inaccuracies",
			description: "Update any inaccuracy in your personal data you have found in our systems",
			href: "/data-request/correct-inaccuracies"
		}
	] satisfies DataRequest[];
</script>

<Meta title="Data Request Center" />

<div class="mb-2 flex flex-col gap-1">
	<h2 class="text-center text-2xl font-medium">Manage your personal data</h2>
	<span class="text-text-80 max-w-xl text-center text-sm font-medium text-pretty">
		Use the options below to make requests regarding your personal data as required by our Privacy
		Policy and applicable privacy laws
	</span>
</div>
<section class="flex w-full max-w-4xl flex-wrap justify-center gap-6">
	{#each requests as request (request.href)}
		<Card tag="a" size="sm" href={request.href}>
			<Card.Header>
				<Card.Title class="text-2xl">{request.name}</Card.Title>
				<Card.Description class="text-text-80">
					{request.description}
				</Card.Description>
			</Card.Header>
			<Card.Body class="flex-1 justify-end">
				<span class="text-text-link font-medium group-hover/card:underline"
					>Start {request.name} Request</span
				>
			</Card.Body>
		</Card>
	{/each}
</section>
