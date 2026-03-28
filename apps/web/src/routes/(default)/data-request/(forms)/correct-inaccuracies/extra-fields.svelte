<script lang="ts">
	import { Form, Textarea } from "@versetools/ui";
	import type { SuperForm } from "sveltekit-superforms";
	import type { z } from "zod";

	import type { CorrectInaccuraciesRequestSchema } from "./schema";

	let { form }: { form: SuperForm<z.infer<typeof CorrectInaccuraciesRequestSchema>, any> } =
		$props();

	const { form: formData } = form;
</script>

<Form.Field {form} name="inaccuracies">
	<Form.Control>
		{#snippet children({ props })}
			<Form.Label>What information needs updating?</Form.Label>
			<Textarea
				{...props}
				placeholder="Describe the inaccuracies"
				bind:value={$formData.inaccuracies}
			/>
		{/snippet}
	</Form.Control>
	<Form.FieldErrors />
</Form.Field>
