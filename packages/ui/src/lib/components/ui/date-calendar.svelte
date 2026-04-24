<script lang="ts" module>
	export type DateCalendarProps = {
		class?: string;
		size?: "sm" | "base";
		locale?: string;
		value?: CalendarDate | null;
		min?: DateValue;
		max?: DateValue;
		defaultDate?: CalendarDate;
		weekdayFormat?: "narrow" | "short" | "long";
		weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
		fixedWeeks?: boolean;
		disabled?: boolean;
		readonly?: boolean;
		heading?: Snippet<[{ props: Record<string, any>; value: CalendarDate | undefined }]>;
		headingPosition?: "left" | "center" | "right";
	} & HTMLAttributes<HTMLElement>;
</script>

<script lang="ts">
	import { CalendarDate, today, type DateValue } from "@internationalized/date";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import { createCalendar } from "@melt-ui/svelte";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import { browser } from "$app/environment";

	import Button from "./button.svelte";

	let {
		class: className,
		size = "base",
		locale = browser ? navigator.language : "en",
		defaultDate = today(
			Intl.DateTimeFormat(locale, {
				dateStyle: "short"
			}).resolvedOptions().timeZone
		),
		value = $bindable(defaultDate),
		min,
		max,
		weekdayFormat = "short",
		weekStartsOn = 0,
		fixedWeeks,
		disabled,
		readonly,
		heading: headingSnippet,
		headingPosition = "center"
	}: DateCalendarProps = $props();

	const calendarBuilder = createCalendar({
		locale,
		weekdayFormat,
		weekStartsOn,
		fixedWeeks,
		preventDeselect: true,
		disabled,
		readonly,
		minValue: min,
		maxValue: max,
		defaultValue: value ?? defaultDate,
		onValueChange(val) {
			value = val.next ?? null;
			return val.next;
		}
	});

	const { calendar, prevButton, nextButton, heading, grid, cell } = calendarBuilder.elements;
	const { headingValue, months, weekdays, value: internalValue } = calendarBuilder.states;
	const { isDateDisabled, isDateUnavailable, isDateSelected } = calendarBuilder.helpers;

	$effect(() => {
		if (value !== $internalValue) {
			internalValue.set(value ?? undefined);
		}
	});
</script>

<section {...$calendar} use:calendar class={twMerge("w-fit", className)}>
	<header class={twMerge("flex items-center", headingPosition === "center" && "justify-between")}>
		{#if headingPosition === "center" || headingPosition === "right"}
			<Button element={prevButton} variant="ghost" size={size === "sm" ? "icon-sm" : "icon"}>
				<ChevronLeftIcon />
			</Button>
		{/if}
		{#if headingPosition === "right"}
			<Button
				element={nextButton}
				variant="ghost"
				size={size === "sm" ? "icon-sm" : "icon"}
				class="mr-auto"
			>
				<ChevronRightIcon />
			</Button>
		{/if}
		{#if headingSnippet}
			{@render headingSnippet({ props: $heading, value: $internalValue })}
		{:else}
			<span {...$heading} use:heading class="font-medium">{$headingValue}</span>
		{/if}
		{#if headingPosition === "left"}
			<Button
				element={prevButton}
				variant="ghost"
				size={size === "sm" ? "icon-sm" : "icon"}
				class="ml-auto"
			>
				<ChevronLeftIcon />
			</Button>
		{/if}
		{#if headingPosition === "center" || headingPosition === "left"}
			<Button element={nextButton} variant="ghost" size={size === "sm" ? "icon-sm" : "icon"}>
				<ChevronRightIcon />
			</Button>
		{/if}
	</header>
	<div class="pt-4">
		<!-- eslint-disable-next-line svelte/require-each-key -->
		{#each $months as month}
			<table {...$grid} use:grid>
				<thead aria-hidden="true" class="mb-2 grid grid-cols-7">
					<tr class="contents">
						<!-- eslint-disable-next-line svelte/require-each-key -->
						{#each $weekdays as day}
							<th class="block">
								<div
									class={twMerge(
										"text-text-60 text-center text-sm",
										size === "sm" ? "w-9" : "w-10"
									)}
								>
									{day}
								</div>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody class="block">
					<!-- eslint-disable-next-line svelte/require-each-key -->
					{#each month.weeks as weekDates}
						<tr class="grid grid-cols-7">
							<!-- eslint-disable-next-line svelte/require-each-key -->
							{#each weekDates as date}
								{@const disabled = $isDateDisabled(date) || $isDateUnavailable(date)}
								{@const selected = $isDateSelected(date)}
								<td
									role="gridcell"
									aria-disabled={disabled}
									aria-selected={selected}
									class={twMerge("align-middle", size === "sm" && "mx-0.5")}
								>
									<button
										type="button"
										{...$cell(date, month.value)}
										use:cell
										{disabled}
										class={twMerge(
											"relative flex cursor-pointer items-center justify-center rounded-sm font-medium transition-colors duration-100 disabled:cursor-not-allowed",
											size === "sm" ? "size-8 text-sm" : "size-10",
											selected
												? "text-date-picker-selected-date-text bg-date-picker-selected-date hover:bg-date-picker-selected-date-hover disabled:bg-date-picker-selected-date-disabled disabled:brightness-75"
												: "text-date-picker-date-text disabled:text-text-60 bg-date-picker-date/0 hover:bg-date-picker-date-hover/5 disabled:bg-date-picker-date-disabled/0"
										)}
									>
										<span class="text-center">{date.day}</span>
									</button>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		{/each}
	</div>
</section>
