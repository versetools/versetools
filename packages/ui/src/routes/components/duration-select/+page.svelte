<script lang="ts">
	import type { TimeDuration } from "@internationalized/date";

	import { DurationSelect } from "$lib";

	import Preview from "../_components/preview.svelte";

	let value = $state<TimeDuration | null>(null);
</script>

<Preview title="Duration Input">
	<DurationSelect bind:value />
	<span>{`${value?.hours ?? 0}h ${value?.minutes ?? 0}m`}</span>
</Preview>
