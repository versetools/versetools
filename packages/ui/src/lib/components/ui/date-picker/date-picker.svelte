<script lang="ts" module>
	const variants = tv({
		base: "relative h-fit py-2.5 pl-10 pr-4",
		variants: {
			variant: {
				default:
					"[--date-picker-bg:var(--color-date-picker)] [--date-picker-border:var(--color-date-picker-border)] [--date-picker-popover-bg:var(--color-date-picker-popover)] [--date-picker-popover-border:var(--color-date-picker-popover-border)] [--date-picker-text:var(--color-date-picker-text)]"
			},
			disabled: {
				true: ""
			},
			readonly: {
				true: ""
			}
		},
		compoundVariants: [
			{
				disabled: true,
				variant: "default",
				class:
					"[--date-picker-bg:var(--color-date-picker-disabled)] [--date-picker-border:var(--color-date-picker-border-disabled)] [--date-picker-text:var(--color-date-picker-text-disabled)]"
			},
			{
				readonly: true,
				variant: "default",
				class:
					"[--date-picker-border:var(--color-date-picker-border-disabled)] [--date-picker-text:var(--color-date-picker-text-disabled)]"
			}
		]
	});

	export type DatePickerProps = {
		id?: string | null;
		locale?: string;
		value?: CalendarDate | null;
		min?: DateValue;
		max?: DateValue;
		class?: string;
		disabled?: boolean;
		readonly?: boolean;
	} & HTMLAttributes<HTMLDivElement>;
</script>

<script lang="ts">
	import {
		BuddhistCalendar,
		CalendarDate,
		CopticCalendar,
		EthiopicCalendar,
		GregorianCalendar,
		HebrewCalendar,
		IndianCalendar,
		IslamicCivilCalendar,
		IslamicTabularCalendar,
		IslamicUmalquraCalendar,
		toCalendarDate,
		today,
		type Calendar,
		type CalendarIdentifier,
		type DateValue
	} from "@internationalized/date";
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import { Popover } from "melt/builders";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";
	import { tv } from "tailwind-variants";

	import { browser } from "$app/environment";
	import { keyboard } from "$lib/builders/utils/keyboard";
	import { Twill } from "$lib/patterns";

	import DateCalendar from "../date-calendar.svelte";
	import StyledRect from "../styled-rect.svelte";
	import DateSegment from "./date-segment.svelte";
	import Button from "../button.svelte";

	let {
		id,
		class: className,
		locale = browser ? navigator.language : "en",
		value = $bindable(),
		min: minValue,
		max: maxValue,
		disabled,
		readonly,
		...rest
	}: DatePickerProps = $props();

	const formatter = $derived(
		Intl.DateTimeFormat(locale, {
			dateStyle: "short"
		})
	);

	const localeOptions = $derived(formatter.resolvedOptions());
	const parts = $derived(formatter.formatToParts(new Date()));

	function toAbsolute(date: DateValue) {
		return date.toDate(localeOptions.timeZone).getTime();
	}

	const todayDate = $derived(today(localeOptions.timeZone));
	const defaultDate = $derived.by(() => {
		if (minValue && toAbsolute(minValue) > toAbsolute(todayDate)) {
			return toCalendarDate(minValue);
		}

		if (maxValue && toAbsolute(maxValue) < toAbsolute(todayDate)) {
			return toCalendarDate(maxValue);
		}

		return todayDate;
	});
	const calendar = $derived.by(() => {
		switch (localeOptions.calendar as CalendarIdentifier) {
			case "buddhist":
				return new BuddhistCalendar();
			case "coptic":
				return new CopticCalendar();
			case "ethiopic":
				return new EthiopicCalendar();
			case "hebrew":
				return new HebrewCalendar();
			case "islamic":
			case "islamic-rgsa":
			case "islamic-civil":
				return new IslamicCivilCalendar();
			case "islamic-tbla":
				return new IslamicTabularCalendar();
			case "islamic-umalqura":
				return new IslamicUmalquraCalendar();
			case "indian":
				return new IndianCalendar();
			case "gregory":
			default:
				return new GregorianCalendar();
		}
	});

	type FieldElements = { [key in "day" | "month" | "year"]: HTMLInputElement | null };
	let fieldElements = $state<FieldElements>({
		day: null,
		month: null,
		year: null
	});

	function getFieldAttrs(
		field: "day" | "month" | "year",
		value: DateValue,
		minValue: DateValue | undefined,
		maxValue: DateValue | undefined,
		{
			calendar,
			parts,
			elements
		}: { calendar: Calendar; parts: Intl.DateTimeFormatPart[]; elements: FieldElements }
	) {
		const currIndex = parts.findIndex((part) => part.type === field);
		const firstPart = parts.find(
			(part) => ["day", "month", "year"].includes(part.type) && part.type !== field
		)!;
		const lastPart = parts.findLast(
			(part) => ["day", "month", "year"].includes(part.type) && part.type !== field
		)!;

		const nextPart =
			parts.find((part, i) => i > currIndex && ["day", "month", "year"].includes(part.type)) ??
			firstPart;
		const prevPart =
			parts.findLast((part, i) => i < currIndex && ["day", "month", "year"].includes(part.type)) ??
			lastPart;

		let max = undefined;
		let min = 1;
		switch (field) {
			case "day":
				if (maxValue && value.year >= maxValue.year && value.month >= maxValue.month) {
					max = maxValue.day;
				} else {
					max = calendar.getDaysInMonth(value);
				}
				if (minValue && value.year <= minValue.year && value.month <= minValue.month) {
					min = minValue.day;
				}
				break;
			case "month":
				if (maxValue && value.year >= maxValue.year) {
					max = maxValue.month;
				} else {
					max = calendar.getMonthsInYear(value);
				}
				if (minValue && value.year <= minValue.year) {
					min = minValue.month;
				}
				break;
			case "year":
				max = maxValue?.year;
				min = minValue?.year ?? 1;
				break;
		}

		return {
			field,
			lastField: lastPart.type as typeof field,
			min,
			max,
			nextElement: elements[nextPart.type as keyof typeof elements],
			prevElement: elements[prevPart.type as keyof typeof elements],
			canBackspaceToPrev: field !== firstPart.type
		};
	}

	const popover = new Popover({
		closeOnOutsideClick: true,
		sameWidth: false,
		focus: {
			trap: false
		},
		floatingConfig: {
			computePosition: {
				placement: "bottom"
			}
		}
	});
</script>

<div
	role="button"
	tabindex="0"
	aria-label="Open date picker"
	{...popover.trigger}
	{...rest}
	class={twMerge(variants({ variant: "default", disabled, readonly }), className)}
	onkeydown={(e) => {
		if (e.key === keyboard.SPACE || e.key === keyboard.ENTER) {
			popover.triggerEl = e.currentTarget;
			popover.open = !popover.open;
		}
		rest.onkeydown?.(e);
	}}
>
	<StyledRect
		class="absolute left-0 top-0 h-full w-full"
		corners="none small"
		bg="--date-picker-bg"
		border="--date-picker-border"
	/>
	{#if disabled}
		<div class="absolute left-0 top-0 h-full w-full p-px">
			<Twill class="opacity-60" corners="none small" stroke="var(--date-picker-border)" />
		</div>
	{/if}
	<CalendarIcon
		class={twMerge(
			"absolute bottom-0 left-3 top-0 my-auto size-5 outline-none",
			disabled || readonly ? "opacity-60" : "cursor-pointer transition-opacity hover:opacity-70"
		)}
	/>
	<div class="relative flex gap-0.5 text-sm font-medium">
		{#each parts as part (part)}
			{#if part.type === "literal"}
				<div class="text-center">{part.value}</div>
			{:else if part.type === "day" || part.type === "month" || part.type === "year"}
				<DateSegment
					bind:ref={fieldElements[part.type]}
					id={id ? `${id}-${part.type}` : undefined}
					{locale}
					{defaultDate}
					bind:date={value}
					{...getFieldAttrs(part.type, value ?? defaultDate, minValue, maxValue, {
						calendar,
						parts,
						elements: fieldElements
					})}
				/>
			{/if}
		{/each}
	</div>
</div>
<div
	{...popover.content}
	class="bg-date-picker-popover border-date-picker-popover-border text-text rounded-md border p-2"
>
	{#if popover.open}
		{#key locale}
			<DateCalendar {locale} {defaultDate} min={minValue} max={maxValue} bind:value />
		{/key}
	{/if}
	{#if (!minValue || toAbsolute(todayDate) >= toAbsolute(minValue)) && (!maxValue || toAbsolute(todayDate) <= toAbsolute(maxValue))}
		<Button
			variant="ghost"
			size="sm"
			class="w-full justify-center"
			onclick={() => (value = today(localeOptions.timeZone))}
		>
			Today
		</Button>
	{/if}
</div>
