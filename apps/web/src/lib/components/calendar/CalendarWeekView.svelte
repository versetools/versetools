<script lang="ts" module>
	export type CalendarWeekViewProps = {
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
		isToday,
		startOfWeek
	} from "@internationalized/date";
	import { ScrollArea } from "@versetools/ui";

	import { browser } from "$app/environment";
	import { useInterval } from "$lib/runes";

	import CalendarDayColumn from "./CalendarDayColumn.svelte";
	import CalendarDayHeading from "./CalendarDayHeading.svelte";
	import CalendarTimeTape from "./CalendarTimeTape.svelte";

	const locale = browser ? navigator.language : "en";
	const timeOptions = Intl.DateTimeFormat(locale, { timeStyle: "short" }).resolvedOptions();

	let {
		focusedDate,
		selecting = $bindable(),
		selectedRange = $bindable(),
		onSelected
	}: CalendarWeekViewProps = $props();

	const startOfWeekDate = $derived(startOfWeek(focusedDate, locale));
	const dates = $derived(Array.from({ length: 7 }).map((_, i) => startOfWeekDate.add({ days: i })));

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
		class="relative grid grid-rows-[auto_1fr]"
		style="grid-template-columns: calc(var(--spacing) * 12) {dates
			.map((date) => {
				if (isToday(date, timeOptions.timeZone)) {
					return '5fr';
				}

				if (isToday(date.subtract({ days: 1 }), timeOptions.timeZone)) {
					return '4fr';
				}

				return '2fr';
			})
			.join(' ')};"
	>
		<header
			class="bg-portal-background z-1 sticky left-0 top-0 col-span-full grid grid-cols-subgrid"
		>
			<div class="col-span-7 col-start-2 grid grid-cols-subgrid">
				{#each dates as date (date)}
					<CalendarDayHeading {date} bind:selecting bind:selectedRange />
				{/each}
			</div>
		</header>
		<CalendarTimeTape />
		{#each dates as date (date)}
			<CalendarDayColumn
				{date}
				currentTime={currentTime.value}
				bind:selecting
				bind:selectedRange
				{onSelected}
			/>
		{/each}
	</section>
</ScrollArea>
