<script lang="ts">
	import CalculatorIcon from "@lucide/svelte/icons/calculator";
	import RocketIcon from "@lucide/svelte/icons/rocket";

	import { Combobox } from "$lib";

	import Preview from "../_components/preview.svelte";

	const options = [
		{ name: "Genesis", value: "genesis" },
		{ name: "Exodus", value: "exodus", Icon: RocketIcon, iconProps: { class: "text-red-400" } },
		{ name: "Leviticus", value: "leviticus" },
		{
			name: "Numbers",
			value: "numbers",
			Icon: CalculatorIcon,
			iconProps: { class: "text-blue-400" }
		},
		{ name: "Deuteronomy", value: "deuteronomy" }
	];
</script>

<Preview title="Combobox">
	<Combobox placeholder="Select a book" {options} />
	<Combobox placeholder="Select books" multiple {options} />
	<Combobox placeholder="Select a book" readonly {options} value="exodus" />
	<Combobox placeholder="Select a book" disabled {options} value="exodus" />

	<Combobox variant="destructive" placeholder="Select a book" {options} />
	<Combobox variant="destructive" placeholder="Select books" multiple {options} />
	<Combobox variant="destructive" placeholder="Select a book" readonly {options} value="exodus" />
	<Combobox variant="destructive" placeholder="Select a book" disabled {options} value="exodus" />
</Preview>
