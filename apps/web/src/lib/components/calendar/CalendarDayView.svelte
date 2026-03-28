<script lang="ts" module>
	export type CalendarDayViewProps = {
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
	import { type CalendarDate, type CalendarDateTime } from "@internationalized/date";
	import { ScrollArea } from "@versetools/ui";

	import { useInterval } from "$lib/runes";

	import CalendarDayColumn from "./CalendarDayColumn.svelte";
	import CalendarDayHeading from "./CalendarDayHeading.svelte";
	import CalendarTimeTape from "./CalendarTimeTape.svelte";

	let {
		focusedDate,
		selecting = $bindable(),
		selectedRange = $bindable(),
		onSelected
	}: CalendarDayViewProps = $props();

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
	direction="Y"
	position="outside"
	class="flex-1"
	inner-class="absolute inset-0"
>
	<section class="relative grid grid-cols-[calc(var(--spacing)*12)_1fr] grid-rows-[auto_1fr]">
		<header
			class="bg-portal-background z-1 sticky left-0 top-0 col-span-full grid grid-cols-subgrid"
		>
			<div class="col-start-2 grid grid-cols-subgrid">
				<CalendarDayHeading date={focusedDate} bind:selecting bind:selectedRange />
			</div>
		</header>
		<CalendarTimeTape />
		<CalendarDayColumn
			date={focusedDate}
			currentTime={currentTime.value}
			bind:selecting
			bind:selectedRange
			{onSelected}
		/>
	</section>
</ScrollArea>
