<script lang="ts">
	import { Card } from "@versetools/ui";
	import { ArrowLeftIcon } from "lucide-svelte";

	import Meta from "$lib/seo/meta.svelte";

	import type { PageData } from "./$types";
	import { RestrictProcessingRequestSchema } from "./schema";
	import DataRequestForm from "../_components/data-request-form.svelte";

	let { data }: { data: PageData } = $props();
</script>

<Meta title="Restrict Processing Request" />

<Card size="xl">
	<Card.Header>
		<a href="/data-request" class="mb-4 flex items-center text-sm hover:underline">
			<ArrowLeftIcon class="mr-2 size-4" />
			Back to Data Request Center
		</a>
		<Card.Title class="text-2xl">Restrict Processing Request</Card.Title>
	</Card.Header>
	<Card.Body>
		<DataRequestForm
			name="Restrict Processing"
			schema={RestrictProcessingRequestSchema}
			data={data.form}
		/>
	</Card.Body>
</Card>
