<script lang="ts">
	import { Heading } from "$lib";

	import Preview from "../_components/preview.svelte";
</script>

<Preview title="Heading">
	<Heading as="h1" size="lg">Heading 1</Heading>
	<Heading as="h2" size="md">Heading 2</Heading>
	<Heading as="h3" size="sm">Heading 3</Heading>
	<Heading as="h4" size="xs">Heading 4</Heading>
	<Heading as="h5" size="base">Heading 5</Heading>
</Preview>
