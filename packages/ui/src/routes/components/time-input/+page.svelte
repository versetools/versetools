<script lang="ts">
	import { Time } from "@internationalized/date";

	import { TimeInput } from "$lib";

	import Preview from "../_components/preview.svelte";

	let value = $state<Time | null>(null);
</script>

<Preview title="Time Input">
	<TimeInput bind:value />
	<span>{`${value}`}</span>
</Preview>
