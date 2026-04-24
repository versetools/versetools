<script lang="ts">
	import { CalendarDate, today } from "@internationalized/date";

	import { DatePicker } from "$lib";

	import Preview from "../_components/preview.svelte";

	let value = $state<CalendarDate | null>(null);
</script>

<Preview title="Date Picker">
	<DatePicker
		bind:value
		min={today("Europe/London")}
		max={today("Europe/London").add({ days: 10 })}
	/>
	<span>{`${value}`}</span>
</Preview>
