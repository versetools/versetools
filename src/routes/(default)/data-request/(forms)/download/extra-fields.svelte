<script lang="ts">
	import { Combobox, Form, Switch } from "@versetools/ui";
	import type { SuperForm } from "sveltekit-superforms";
	import type { z } from "zod";

	import { config } from "$lib/config";

	import type { DownloadRequestSchema } from "./schema";

	const productOptions = Object.entries(config.services).map(([name, product]) => ({
		name: product.name,
		value: name as keyof typeof config.services
	}));

	let { form }: { form: SuperForm<z.infer<typeof DownloadRequestSchema>, any> } = $props();

	const { form: formData } = form;
</script>

<Form.Field {form} name="products" class="gap-2">
	<Form.Control>
		{#snippet children({ props })}
			<Form.Label>Products</Form.Label>
			<Form.Field {form} name="allProducts" class="flex-row items-center gap-2">
				<Form.Control>
					{#snippet children({ props })}
						<Switch {...props} bind:value={$formData.allProducts} />
						<Form.Label>Request for all products</Form.Label>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			{#if !$formData.allProducts}
				<Combobox
					{...props}
					placeholder="Select products"
					multiple
					options={productOptions}
					disabled={$formData.allProducts}
					bind:value={$formData.products}
				/>
			{/if}
		{/snippet}
	</Form.Control>
	<Form.FieldErrors />
</Form.Field>
