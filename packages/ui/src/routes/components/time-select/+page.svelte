<script lang="ts">
	import { Time } from "@internationalized/date";

	import { TimeSelect } from "$lib";

	import Preview from "../_components/preview.svelte";

	let value = $state<Time | null>(null);
</script>

<Preview title="Time Select">
	<TimeSelect bind:value min={new Time(6, 27)} max={new Time(17, 44)} />
	<span>{`${value}`}</span>
</Preview>
