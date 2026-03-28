<script lang="ts" module>
	export type CalendarDayColumnProps = {
		date: CalendarDate;
		currentTime: number;
		selecting?: boolean;
		selectedRange?: {
			initial: CalendarDateTime;
			from: CalendarDateTime;
			to: CalendarDateTime;
		} | null;
		onSelected?: (range: { startDate: CalendarDateTime; endDate: CalendarDateTime }) => unknown;
	};
</script>

<script lang="ts">
	import {
		isToday,
		Time,
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
		currentTime,
		selecting = $bindable(false),
		selectedRange = $bindable(null),
		onSelected
	}: CalendarDayColumnProps = $props();

	const viewOfToday = $derived(isToday(date, timeOptions.timeZone));

	function isSelected(dateTime: CalendarDateTime, range: typeof selectedRange) {
		if (!range) return false;

		const time = dateTime.toDate(timeOptions.timeZone).getTime();

		const fromTime = range.from.toDate(timeOptions.timeZone).getTime();
		const toTime = range.to.toDate(timeOptions.timeZone).getTime();

		const startTime = Math.min(fromTime, toTime);
		const endTime = Math.max(fromTime, toTime);

		return startTime <= time && endTime > time;
	}
</script>

<div class={twMerge("border-border relative min-w-20 border-l border-dashed last:border-r")}>
	<div class="flex flex-col" aria-hidden="true">
		{#each Array.from( { length: 24 } ).flatMap( (_, h) => Array.from( { length: 2 } ).map((_, i) => new Time(h % 24, i * 30, 0)) ) as time (time)}
			{@const dateTime = toCalendarDateTime(date, time)}
			{@const selected = isSelected(dateTime, selectedRange)}
			<!-- svelte-ignore a11y_mouse_events_have_key_events -->
			<button
				aria-hidden="true"
				class={twMerge(
					"border-border hover:bg-light/10 relative flex h-8 cursor-pointer items-center border-t",
					time.minute === 30 && "border-dashed",
					selected && "hover:bg-accent-60 bg-accent-80"
				)}
				onmouseover={() => {
					if (!selecting || !selectedRange) return;
					selectedRange =
						selectedRange.initial.compare(dateTime) <= 0
							? { ...selectedRange, from: selectedRange.initial, to: dateTime.add({ minutes: 30 }) }
							: {
									...selectedRange,
									from: dateTime,
									to: selectedRange.initial.add({ minutes: 30 })
								};
				}}
				onmousedown={async (ev) => {
					if (selecting || ev.button !== 0) return;

					if (selected) {
						if (selectedRange && onSelected) {
							let startDate, endDate;
							if (selectedRange.from.compare(selectedRange.to) < 0) {
								startDate = selectedRange.from;
								endDate = selectedRange.to;
							} else {
								startDate = selectedRange.to;
								endDate = selectedRange.from;
							}

							onSelected({ startDate, endDate });
						}
						return;
					}

					selectedRange = { initial: dateTime, from: dateTime, to: dateTime.add({ minutes: 30 }) };
					selecting = true;
				}}
			>
			</button>
		{/each}
		<div class="border-border border-t"></div>
	</div>
	<div
		class={twMerge(
			"border-accent-80 pointer-events-none absolute left-0 right-0 border-b border-t",
			!viewOfToday && "border-dashed"
		)}
		style="top: {(currentTime / 1440) * 100}%;"
	>
		{#if viewOfToday}
			<div
				class="bg-accent-80 border-background absolute -left-3 top-1/2 size-3.5 -translate-y-1/2 rounded-full border-2"
			></div>
		{/if}
	</div>
</div>
