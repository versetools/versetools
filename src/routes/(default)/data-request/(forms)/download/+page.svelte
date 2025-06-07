<script lang="ts">
	import { Card } from "@versetools/ui";
	import { ArrowLeftIcon } from "lucide-svelte";

	import { config } from "$lib/config";
	import Meta from "$lib/seo/meta.svelte";

	import type { PageData } from "./$types";
	import ExtraFields from "./extra-fields.svelte";
	import { DownloadRequestSchema } from "./schema";
	import DataRequestForm from "../_components/data-request-form.svelte";

	let { data }: { data: PageData } = $props();
</script>

<Meta title="Data Access Request" />

<Card size="xl">
	<Card.Header>
		<a href="/data-request" class="mb-4 flex items-center text-sm hover:underline">
			<ArrowLeftIcon class="mr-2 size-4" />
			Back to Data Request Center
		</a>
		<Card.Title class="text-2xl">Data Access Request</Card.Title>
		<Card.Description tag="span">
			<p>Receive an export of all of your personal data we have collected from our systems.</p>
			<p class="mt-2">
				This request is for <span class="text-text font-semibold">personal data only</span>, if you
				would like to download product specific account and usage data please visit the appropriate
				product page:
			</p>
			<ul class="my-2 ml-4 list-disc">
				{#each Object.values(config.services) as product (product.name)}
					<li>
						<a href={product.exportUrl} class="text-text-link hover:underline">
							Download {product.name} account and usage data
						</a>
					</li>
				{/each}
			</ul>
		</Card.Description>
	</Card.Header>
	<Card.Body>
		<DataRequestForm name="Data Access" schema={DownloadRequestSchema} data={data.form}>
			{#snippet children({ form })}
				<ExtraFields {form} />
			{/snippet}
		</DataRequestForm>
	</Card.Body>
</Card>
