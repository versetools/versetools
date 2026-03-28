<script lang="ts">
	import { Card } from "@versetools/ui";
	import { ArrowLeftIcon } from "lucide-svelte";

	import Meta from "$lib/seo/meta.svelte";

	import type { PageData } from "./$types";
	import { DeletionRequestSchema } from "./schema";
	import DataRequestForm from "../_components/data-request-form.svelte";

	let { data }: { data: PageData } = $props();
</script>

<Meta title="Deletion Request" />

<Card size="xl">
	<Card.Header>
		<a href="/data-request" class="mb-4 flex items-center text-sm hover:underline">
			<ArrowLeftIcon class="mr-2 size-4" />
			Back to Data Request Center
		</a>
		<Card.Title class="text-2xl">Deletion Request</Card.Title>
		<Card.Description>
			<span class="text-text font-bold">NOTE:</span> The processing of this request will cause all accounts
			containing the provided email address to be deleted.
		</Card.Description>
	</Card.Header>
	<Card.Body>
		<DataRequestForm name="Deletion" schema={DeletionRequestSchema} data={data.form} />
	</Card.Body>
</Card>
