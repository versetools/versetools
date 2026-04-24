<script lang="ts">
	import { Button, Switch } from "$lib";

	import Preview from "../_components/preview.svelte";

	let value = $state(false);
</script>

<Preview title="Switch">
	<Switch bind:value />
	<Button onclick={() => (value = false)}>Reset value</Button>
</Preview>
