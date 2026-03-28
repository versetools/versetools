<script lang="ts" module>
	export type CalendarMonthViewProps = {
		focusedDate: CalendarDate;
		selecting: boolean;
		selectedRange: {
			initial: CalendarDateTime;
			from: CalendarDateTime;
			to: CalendarDateTime;
		} | null;
		onSelected?: (range: { startDate: CalendarDateTime; endDate: CalendarDateTime }) => unknown;
	};
</script>

<script lang="ts">
	import {
		CalendarDate,
		type CalendarDateTime,
		getWeeksInMonth,
		isToday,
		startOfMonth,
		startOfWeek,
		toCalendarDateTime
	} from "@internationalized/date";
	import { ScrollArea } from "@versetools/ui";
	import { twMerge } from "tailwind-merge";

	import { browser } from "$app/environment";
	import { useInterval } from "$lib/runes";

	const locale = browser ? navigator.language : "en";
	const timeOptions = Intl.DateTimeFormat(locale, { timeStyle: "short" }).resolvedOptions();

	let {
		focusedDate,
		selecting = $bindable(),
		selectedRange = $bindable(),
		onSelected
	}: CalendarMonthViewProps = $props();

	const startOfMonthDate = $derived(startOfWeek(startOfMonth(focusedDate), locale));
	const weeksInMonth = $derived(getWeeksInMonth(focusedDate, locale));
	const dates = $derived(
		Array.from({ length: weeksInMonth }).flatMap((_, w) =>
			Array.from({ length: 7 }).map((_, i) => startOfMonthDate.add({ days: w * 7 + i }))
		)
	);

	function isSelected(dateTime: CalendarDateTime, range: typeof selectedRange) {
		if (!range) return false;

		const time = dateTime.toDate(timeOptions.timeZone).getTime();

		const fromTime = range.from.toDate(timeOptions.timeZone).getTime();
		const toTime = range.to.toDate(timeOptions.timeZone).getTime();

		const startTime = Math.min(fromTime, toTime);
		const endTime = Math.max(fromTime, toTime);

		return startTime <= time && endTime > time;
	}

	const currentTime = useInterval(() => {
		const now = new Date();
		return now.getHours() * 60 + now.getMinutes();
	}, 30000);

	let scrollArea = $state<HTMLElement | undefined>(undefined);
</script>

<ScrollArea
	bind:ref={
		() => scrollArea,
		(el) => {
			scrollArea = el;
			if (!el) return;

			el.scrollTop = Math.max(0, (el.scrollHeight * currentTime.value) / 1440 - 50);
		}
	}
	direction="XY"
	position="outside"
	class="flex-1"
	inner-class="absolute inset-0"
>
	<section
		class="relative grid h-full grid-cols-7"
		style="grid-template-rows: auto repeat({weeksInMonth}, 1fr);"
	>
		<header
			class="bg-portal-background z-1 sticky left-0 top-0 col-span-full grid grid-cols-subgrid"
		>
			{#each dates.slice(0, 7) as date (date)}
				<div class="@container not-first:border-l border-border select-none pb-1 pl-2.5 text-left">
					<span class="text-text-60 @4xs:hidden text-xs font-medium">
						{Intl.DateTimeFormat(locale, { weekday: "short" }).format(
							date.toDate(timeOptions.timeZone)
						)}
					</span>
					<span class="text-text-60 @max-4xs:hidden text-xs font-medium">
						{Intl.DateTimeFormat(locale, { weekday: "long" }).format(
							date.toDate(timeOptions.timeZone)
						)}
					</span>
				</div>
			{/each}
		</header>
		{#each dates as date, i (date)}
			{@const dateTime = toCalendarDateTime(date)}
			{@const viewOfToday = isToday(date, timeOptions.timeZone)}
			{@const selected = isSelected(dateTime, selectedRange)}
			<!-- svelte-ignore a11y_mouse_events_have_key_events -->
			<button
				aria-hidden="true"
				class={twMerge(
					"border-border hover:bg-light/10 relative flex min-h-8 cursor-pointer flex-col border-t px-2 py-1",
					selected && "hover:bg-accent-60 bg-accent-80"
				)}
				onmouseover={() => {
					if (!selecting || !selectedRange) return;
					selectedRange =
						selectedRange.initial.compare(dateTime) <= 0
							? { ...selectedRange, from: selectedRange.initial, to: dateTime.add({ days: 1 }) }
							: { ...selectedRange, from: dateTime, to: selectedRange.initial.add({ days: 1 }) };
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

					selectedRange = { initial: dateTime, from: dateTime, to: dateTime.add({ days: 1 }) };
					selecting = true;
				}}
			>
				<span
					class={twMerge(
						"text-text-80 w-fit text-sm font-medium",
						viewOfToday && "bg-accent-80 text-text -ml-1.5 rounded-sm px-1.5"
					)}
				>
					{Intl.DateTimeFormat(locale, {
						day: "numeric",
						month: i === 0 || date.day === 1 ? "short" : undefined
					}).format(date.toDate(timeOptions.timeZone))}
				</span>
			</button>
		{/each}
	</section>
</ScrollArea>
