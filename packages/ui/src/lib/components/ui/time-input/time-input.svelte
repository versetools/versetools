<script lang="ts" module>
	export function parseTime(value: string): Time | null {
		const [hour, minute, second] = value.split(":");
		if (!hour || !minute) {
			return null;
		}

		const hourNum = parseInt(hour);
		const minuteNum = parseInt(minute);
		const secondNum = second ? parseInt(second) : 0;

		if (isNaN(hourNum) || isNaN(minuteNum) || isNaN(secondNum)) {
			return null;
		}

		return new Time(hourNum, minuteNum, secondNum);
	}

	export function stringifyTime(value: Time): string {
		let str = `${value.hour}:${value.minute.toString().padStart(2, "0")}`;

		if (value.second !== 0) {
			str += `:${value.second.toString().padStart(2, "0")}`;
		}

		return str;
	}

	type TimeInputValueType = "string" | "Time";
	type TimeOrString<TValueType extends TimeInputValueType> = TValueType extends "Time"
		? Time
		: TValueType extends "string"
			? string
			: never;

	export type TimeInputProps<TValueType extends TimeInputValueType> = {
		locale?: string;
		valueType?: TValueType;
		value?: TimeOrString<TValueType> | null;
		min?: Time | null;
		max?: Time | null;
		class?: string;
	} & HTMLFieldsetAttributes;
</script>

<script lang="ts" generics="TValueType extends TimeInputValueType = 'Time'">
	import { Time } from "@internationalized/date";
	import type { HTMLFieldsetAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import { browser } from "$app/environment";
	import { keyboard } from "$lib/builders/utils/keyboard";

	import TimeSegment from "./time-segment.svelte";

	let {
		id,
		locale,
		valueType = "Time" as TValueType,
		value = $bindable(),
		min: minValue,
		max: maxValue,
		class: className,
		...rest
	}: TimeInputProps<TValueType> = $props();

	function setValue(time: Time) {
		const clampedHour = Math.max(minValue?.hour ?? 0, Math.min(maxValue?.hour ?? 23, time.hour));
		const clampedTime = new Time(
			clampedHour,
			Math.max(
				minValue && clampedHour <= minValue.hour ? minValue.minute : 0,
				Math.min(maxValue && clampedHour >= maxValue.hour ? maxValue.minute : 59, time.minute)
			)
		);

		value = (
			valueType === "Time" ? clampedTime : stringifyTime(clampedTime)
		) as TimeOrString<TValueType>;
	}

	const time = $derived(
		valueType === "Time"
			? value instanceof Time
				? value
				: null
			: typeof value === "string"
				? parseTime(value)
				: null
	);

	const localeOptions = $derived(
		Intl.DateTimeFormat(locale ?? (browser ? navigator.language : "en"), {
			timeStyle: "long"
		}).resolvedOptions()
	);
	const hourCycle = $derived(parseInt(localeOptions.hourCycle!.slice(1)));
	const defaultTime = $derived(minValue ?? new Time());

	const minHour = $derived.by(() => {
		if (hourCycle > 12) {
			const min = hourCycle - 23;
			return Math.max(min, minValue ? minValue.hour + min : 0);
		}

		const min = hourCycle - 11;
		if (!minValue) return min;

		if (minValue.hour === 12) {
			return min === 0 ? 0 : 12;
		}
		return Math.max(min, (minValue.hour % 12) + min);
	});
	const maxHour = $derived.by(() => {
		if (!maxValue) return hourCycle;

		if (hourCycle > 12) {
			return Math.min(hourCycle, maxValue.hour + (hourCycle - 23));
		}

		return Math.min(hourCycle, (maxValue.hour % 12) + (hourCycle - 12));
	});

	let hourEl = $state<HTMLInputElement | null>(null);
	let minuteEl = $state<HTMLInputElement | null>(null);
	let periodEl = $state<HTMLInputElement | null>(null);
</script>

<fieldset
	{id}
	class={twMerge("flex justify-center gap-0.5 text-sm font-medium", className)}
	{...rest}
>
	<legend class="sr-only">Time</legend>
	<input type="hidden" value={time ? stringifyTime(time) : ""} />
	<TimeSegment
		bind:ref={hourEl}
		id={id ? `${id}-hour` : undefined}
		field="hour"
		min={minHour}
		max={maxHour}
		hourCycle={hourCycle > 12 ? 24 : 12}
		{defaultTime}
		{time}
		{setValue}
		nextElement={minuteEl}
		prevElement={periodEl ?? minuteEl}
	/>
	<span>:</span>
	<TimeSegment
		bind:ref={minuteEl}
		id={id ? `${id}-minute` : undefined}
		field="minute"
		min={minValue && (time?.hour ?? 0) <= minValue.hour ? minValue.minute : 0}
		max={maxValue && (time?.hour ?? 0) >= maxValue.hour ? maxValue.minute : 59}
		{defaultTime}
		{time}
		{setValue}
		nextElement={periodEl ?? hourEl}
		prevElement={hourEl}
		canBackspaceToPrev
	/>
	{#if browser && localeOptions.hour12}
		{@const min = minValue && minValue.hour >= 12 ? 12 : 0}
		{@const max = maxValue && maxValue.hour < 12 ? 0 : 12}
		{@const hour = time?.hour ?? 0}
		{@const period = Math.max(min, Math.min(max, hour >= 12 ? 12 : 0))}
		<input
			bind:this={periodEl}
			class="w-7 text-center caret-transparent"
			type="text"
			role="spinbutton"
			inputmode="text"
			pattern="AM|PM"
			minlength="2"
			maxlength="2"
			spellcheck="false"
			enterkeyhint="next"
			aria-label="AM/PM"
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={period}
			aria-valuetext={period === 12 ? "PM" : "AM"}
			value={period === 12 ? "PM" : "AM"}
			onkeydown={(e) => {
				if (min > 0 || max < 12) return;

				switch (e.key) {
					case keyboard.ARROW_UP:
						e.preventDefault();
						setValue((time ?? new Time()).cycle("hour", 12, { hourCycle: 24 }));
						return;
					case keyboard.ARROW_DOWN:
						e.preventDefault();
						setValue((time ?? new Time()).cycle("hour", -12, { hourCycle: 24 }));
						return;
					case keyboard.ARROW_LEFT:
						e.preventDefault();
						minuteEl?.focus();
						return;
					case keyboard.ARROW_RIGHT:
						e.preventDefault();
						hourEl?.focus();
						return;
				}

				if (e.key === "a") {
					e.preventDefault();
					const hour = time?.hour ?? 0;
					if (hour >= 12) {
						setValue((time ?? new Time()).cycle("hour", -12, { hourCycle: 24 }));
					}
					return;
				} else if (e.key === "p") {
					e.preventDefault();
					const hour = time?.hour ?? 0;
					if (hour < 12) {
						setValue((time ?? new Time()).cycle("hour", 12, { hourCycle: 24 }));
					}
					return;
				}
			}}
		/>
	{/if}
</fieldset>
