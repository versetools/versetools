<script lang="ts">
	import { Accordion, Switch } from "$lib";

	import Preview from "../_components/preview.svelte";

	let disabled = $state(false);
</script>

<Preview title="Accordion">
	<Accordion {disabled}>
		{#snippet children(accordion)}
			<Accordion.Item {accordion} title="What is it?">
				A collection of components used to build VerseTools websites.
			</Accordion.Item>
			<Accordion.Item {accordion} title="Isn't it cool?">Absolutely! It's the best!</Accordion.Item>
			<Accordion.Item {accordion} title="Where's the documentation?">
				It's right here, you're looking at it!
			</Accordion.Item>
		{/snippet}
	</Accordion>
	<Accordion variant="secondary" {disabled}>
		{#snippet children(accordion)}
			<Accordion.Item {accordion} title="What is it?">
				A collection of components used to build VerseTools websites.
			</Accordion.Item>
			<Accordion.Item {accordion} title="Isn't it cool?">Absolutely! It's the best!</Accordion.Item>
			<Accordion.Item {accordion} title="Where's the documentation?">
				It's right here, you're looking at it!
			</Accordion.Item>
		{/snippet}
	</Accordion>
	<Accordion variant="light" {disabled}>
		{#snippet children(accordion)}
			<Accordion.Item {accordion} title="What is it?">
				A collection of components used to build VerseTools websites.
			</Accordion.Item>
			<Accordion.Item {accordion} title="Isn't it cool?">Absolutely! It's the best!</Accordion.Item>
			<Accordion.Item {accordion} title="Where's the documentation?">
				It's right here, you're looking at it!
			</Accordion.Item>
		{/snippet}
	</Accordion>
	<div class="flex items-center gap-1">
		<Switch bind:value={disabled} />
		<span>{disabled ? "Disabled" : "Disable"}</span>
	</div>
</Preview>
