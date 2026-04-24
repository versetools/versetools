<script lang="ts">
	import { Button, SegmentedButton } from "$lib";

	import Preview from "../_components/preview.svelte";

	const options = [
		{ name: "No access", value: "no-access", variant: "destructive" as const },
		{ name: "Read", value: "read", tooltip: "Allows the user to read the document" },
		{ name: "Write", value: "write", tooltip: "Allows the user to make changes to the document" }
	];

	const options2 = [
		{ name: "Monthly", value: "monthly" },
		{ name: "Annually", value: "annually" }
	];

	let value = $state(options[0]!.value);
</script>

<Preview title="Segmented Button">
	<SegmentedButton size="sm" {options} bind:value />
	<SegmentedButton options={options2} cycle value="monthly" />
	<span class="text-text-60 text-xs font-medium">Value: {value}</span>
	<Button onclick={() => (value = "no-access")}>Reset value</Button>
</Preview>
