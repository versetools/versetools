<script lang="ts">
	import { CalendarDate } from "@internationalized/date";

	import { DateCalendar } from "$lib";

	import Preview from "../_components/preview.svelte";

	let value = $state<CalendarDate | null>(null);
</script>

<Preview title="Date Calendar">
	<DateCalendar fixedWeeks bind:value />
	<span>{`${value}`}</span>
</Preview>
