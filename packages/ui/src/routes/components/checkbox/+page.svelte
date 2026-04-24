<script lang="ts">
	import { Button, Checkbox } from "$lib";

	import Preview from "../_components/preview.svelte";

	let value = $state(false);
	let indeterminateValue = $state<boolean | "indeterminate">("indeterminate");
</script>

<Preview title="Checkbox">
	<Checkbox bind:value />
	<Checkbox bind:value={indeterminateValue} allowIndeterminate indeterminateWhen={false} />
	<Button onclick={() => (value = false)}>Reset value</Button>
</Preview>
