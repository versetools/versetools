<script lang="ts" module>
	export type CalendarDayHeadingProps = {
		date: CalendarDate;
		selecting?: boolean;
		selectedRange?: {
			initial: CalendarDateTime;
			from: CalendarDateTime;
			to: CalendarDateTime;
		} | null;
	};
</script>

<script lang="ts">
	import {
		isToday,
		toCalendarDateTime,
		CalendarDate,
		type CalendarDateTime
	} from "@internationalized/date";
	import { twMerge } from "tailwind-merge";

	import { browser } from "$app/environment";

	const locale = browser ? navigator.language : "en";
	const timeOptions = Intl.DateTimeFormat(locale, { timeStyle: "short" }).resolvedOptions();

	let {
		date,
		selecting = $bindable(false),
		selectedRange = $bindable(null)
	}: CalendarDayHeadingProps = $props();

	const viewOfToday = $derived(isToday(date, timeOptions.timeZone));
	const dateTime = $derived(toCalendarDateTime(date));
</script>

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<button
	class="@container hover:bg-light/10 not-first:border-l border-border flex cursor-pointer select-none flex-col pb-3 pl-2.5 pt-1 text-left"
	onmouseover={() => {
		if (!selecting || !selectedRange) return;
		selectedRange =
			selectedRange.initial.compare(dateTime) <= 0
				? { ...selectedRange, from: selectedRange.initial, to: dateTime.add({ days: 1 }) }
				: { ...selectedRange, from: dateTime, to: selectedRange.initial.add({ days: 1 }) };
	}}
	onmousedown={async (ev) => {
		if (selecting || ev.button !== 0) return;

		selectedRange = { initial: dateTime, from: dateTime, to: dateTime.add({ days: 1 }) };
		selecting = true;
	}}
>
	<span
		class={twMerge(
			"text-lg font-medium",
			viewOfToday && "bg-accent-80 -ml-1.5 w-fit rounded-sm px-1.5"
		)}
	>
		{date.day}
	</span>
	<span class="text-text-60 @4xs:hidden text-xs font-medium">
		{Intl.DateTimeFormat(locale, { weekday: "short" }).format(date.toDate(timeOptions.timeZone))}
	</span>
	<span class="text-text-60 @max-4xs:hidden text-xs font-medium">
		{Intl.DateTimeFormat(locale, { weekday: "long" }).format(date.toDate(timeOptions.timeZone))}
	</span>
</button>
