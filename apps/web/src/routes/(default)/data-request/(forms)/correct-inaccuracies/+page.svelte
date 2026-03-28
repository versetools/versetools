<script lang="ts">
	import { Card } from "@versetools/ui";
	import { ArrowLeftIcon } from "lucide-svelte";

	import Meta from "$lib/seo/meta.svelte";

	import type { PageData } from "./$types";
	import ExtraFields from "./extra-fields.svelte";
	import { CorrectInaccuraciesRequestSchema } from "./schema";
	import DataRequestForm from "../_components/data-request-form.svelte";

	let { data }: { data: PageData } = $props();
</script>

<Meta title="Correct Inaccuracies Request" />

<Card size="xl">
	<Card.Header>
		<a href="/data-request" class="mb-4 flex items-center text-sm hover:underline">
			<ArrowLeftIcon class="mr-2 size-4" />
			Back to Data Request Center
		</a>
		<Card.Title class="text-2xl">Correct Inaccuracies Request</Card.Title>
	</Card.Header>
	<Card.Body>
		<DataRequestForm
			name="Correct Inaccuracies"
			schema={CorrectInaccuraciesRequestSchema}
			data={data.form}
		>
			{#snippet children({ form })}
				<ExtraFields {form} />
			{/snippet}
		</DataRequestForm>
	</Card.Body>
</Card>
