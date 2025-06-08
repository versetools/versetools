<script lang="ts">
	import { Combobox, Form, Switch } from "@versetools/ui";
	import type { SuperForm } from "sveltekit-superforms";
	import type { z } from "zod";

	import { config } from "$lib/config";

	import type { DownloadRequestSchema } from "./schema";

	const serviceOptions = Object.entries(config.services).map(([name, service]) => ({
		name: service.name,
		value: name as keyof typeof config.services
	}));

	let { form }: { form: SuperForm<z.infer<typeof DownloadRequestSchema>, any> } = $props();

	const { form: formData } = form;
</script>

<Form.Field {form} name="services" class="gap-2">
	<Form.Control>
		{#snippet children({ props })}
			<Form.Label>Services</Form.Label>
			<Form.Field {form} name="allServices" class="flex-row items-center gap-2">
				<Form.Control>
					{#snippet children({ props })}
						<Switch {...props} bind:value={$formData.allServices} />
						<Form.Label>Request for all services</Form.Label>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			{#if !$formData.allServices}
				<Combobox
					{...props}
					placeholder="Select service(s)"
					multiple
					options={serviceOptions}
					disabled={$formData.allServices}
					bind:value={$formData.services}
				/>
			{/if}
		{/snippet}
	</Form.Control>
	<Form.FieldErrors />
</Form.Field>
