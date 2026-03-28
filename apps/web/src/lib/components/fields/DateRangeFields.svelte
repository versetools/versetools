<script lang="ts" module>
	type FormWithDateRange = {
		startDate?: number;
		endDate?: number;
	};

	export type DateRangeFieldsProps<T extends FormWithDateRange> = {
		form: SuperForm<T, any>;
	};
</script>

<script lang="ts" generics="T extends FormWithDateRange">
	import {
		CalendarDate,
		fromAbsolute,
		isSameDay,
		Time,
		toCalendarDate,
		toTime
	} from "@internationalized/date";
	import MoveRightIcon from "@lucide/svelte/icons/move-right";
	import { Form, DatePicker, TimeSelect, DurationSelect, Switch, Label } from "@versetools/ui";
	import type { SuperForm } from "sveltekit-superforms";
	import { twMerge } from "tailwind-merge";

	import { browser } from "$app/environment";

	let { form }: DateRangeFieldsProps<T> = $props();

	const typedForm = form as unknown as SuperForm<FormWithDateRange, any>;

	const { form: formData } = typedForm;

	const locale = browser ? navigator.language : "en";
	const timeOptions = Intl.DateTimeFormat(locale, { timeStyle: "short" }).resolvedOptions();

	function toTimestamp(calendarDate: CalendarDate, time: Time) {
		const date = calendarDate.toDate(timeOptions.timeZone);
		date.setHours(time.hour, time.minute);
		return date.getTime();
	}

	const initialStart = fromAbsolute($formData.startDate ?? Date.now(), timeOptions.timeZone);
	const initialEnd = fromAbsolute(
		$formData.endDate ?? Date.now() + 3600 * 1000,
		timeOptions.timeZone
	);

	let startDate = $state(toCalendarDate(initialStart));
	let startTime = $state(toTime(initialStart));
	let endDate = $state(toCalendarDate(initialEnd));
	let endTime = $state(toTime(initialEnd));

	$effect(() => {
		$formData.startDate = toTimestamp(startDate, startTime);
	});

	$effect(() => {
		$formData.endDate = toTimestamp(endDate, endTime);
	});

	function isAllDay() {
		return (
			startTime.hour === 0 &&
			startTime.minute === 0 &&
			endTime.hour === 0 &&
			endTime.minute === 0 &&
			!isSameDay(startDate, endDate)
		);
	}

	// svelte-ignore state_referenced_locally
	let timesBeforeAllDay = $state({ startTime, endTime, addedDay: false });
	let allDay = $state(isAllDay());
</script>

<fieldset
	class={twMerge(
		"grid gap-x-2 gap-y-4",
		allDay
			? "@xl:grid-cols-[repeat(4,minmax(auto,max-content))] @md:items-center @md:grid-cols-[repeat(3,minmax(auto,max-content))]"
			: "@3xl:items-center @3xl:grid-cols-[minmax(auto,max-content)_auto_minmax(auto,max-content)]"
	)}
>
	<Form.Field form={typedForm} name="startDate">
		<div class="flex gap-1">
			<Form.Control>
				{#snippet children({ props })}
					<div
						class={twMerge("flex flex-col gap-1", allDay ? "@max-lg:flex-1" : "@max-3xl:flex-1")}
					>
						<Form.Label>Start date</Form.Label>
						<DatePicker
							{...props}
							bind:value={
								() => startDate,
								(value) => {
									const duration =
										toTimestamp(endDate, endTime) - toTimestamp(startDate, startTime);
									startDate = value;

									const newEndDateTime = fromAbsolute(
										toTimestamp(value, startTime) + duration,
										timeOptions.timeZone
									);
									endDate = toCalendarDate(newEndDateTime);
									endTime = toTime(newEndDateTime);
								}
							}
						/>
					</div>
				{/snippet}
			</Form.Control>
			{#if !allDay}
				<Form.Control>
					{#snippet children({ props })}
						<div class="flex flex-col gap-1">
							<Form.Label>Start time</Form.Label>
							<TimeSelect
								{...props}
								required
								bind:value={
									() => startTime,
									(value) => {
										const duration =
											toTimestamp(endDate, endTime) - toTimestamp(startDate, startTime);
										startTime = value;

										const newEndDateTime = fromAbsolute(
											toTimestamp(startDate, value) + duration,
											timeOptions.timeZone
										);
										endDate = toCalendarDate(newEndDateTime);
										endTime = toTime(newEndDateTime);
									}
								}
							/>
						</div>
					{/snippet}
				</Form.Control>
			{/if}
		</div>
		<Form.FieldErrors />
	</Form.Field>
	<MoveRightIcon
		class={twMerge(
			"mx-auto mt-5 size-5 shrink-0",
			allDay ? "@max-md:hidden @lg:mx-2" : "@max-3xl:hidden"
		)}
	/>
	<Form.Field form={typedForm} name="endDate">
		<div class="flex flex-wrap gap-1">
			<Form.Control>
				{#snippet children({ props })}
					<div
						class={twMerge("flex flex-col gap-1", allDay ? "@max-lg:flex-1" : "@max-3xl:flex-1")}
					>
						<Form.Label>End date</Form.Label>
						<DatePicker {...props} min={startDate} bind:value={endDate} />
					</div>
				{/snippet}
			</Form.Control>
			{#if !allDay}
				<Form.Control>
					{#snippet children({ props })}
						<div class="flex flex-col gap-1">
							<Form.Label>End time</Form.Label>
							<TimeSelect
								{...props}
								required
								min={startDate.year === endDate.year &&
								startDate.month === endDate.month &&
								startDate.day === endDate.day
									? startTime
									: undefined}
								bind:value={endTime}
							/>
						</div>
					{/snippet}
				</Form.Control>
				<Form.Control>
					{#snippet children({ props })}
						<div class="flex flex-col gap-1">
							<Form.Label>Duration</Form.Label>
							<DurationSelect
								{...props}
								required
								bind:value={
									() => {
										const duration =
											toTimestamp(endDate, endTime) - toTimestamp(startDate, startTime);

										const hours = Math.floor(duration / 3600000);
										const minutes = Math.floor(duration / 60000) % 60;

										return {
											hours,
											minutes
										};
									},
									(value) => {
										const duration = value.hours * 3600000 + value.minutes * 60000;

										const newEndDateTime = fromAbsolute(
											toTimestamp(startDate, startTime) + duration,
											timeOptions.timeZone
										);
										endDate = toCalendarDate(newEndDateTime);
										endTime = toTime(newEndDateTime);
									}
								}
							/>
						</div>
					{/snippet}
				</Form.Control>
			{/if}
		</div>
		<Form.FieldErrors />
	</Form.Field>
	<div class={twMerge("flex w-fit items-center gap-2", allDay && "@xl:mt-5")}>
		<Switch
			id="date-range-all-day"
			class="shrink-0"
			bind:value={
				() => allDay,
				(v) => {
					if (v) {
						const addDay = isSameDay(startDate, endDate);
						timesBeforeAllDay = { startTime, endTime, addedDay: addDay };

						startTime = startTime.set({ hour: 0, minute: 0 });
						endTime = endTime.set({ hour: 0, minute: 0 });

						if (addDay) {
							endDate = startDate.add({ days: 1 });
						}
					} else {
						startTime = timesBeforeAllDay.startTime;
						endTime = timesBeforeAllDay.endTime;

						if (timesBeforeAllDay.addedDay && isSameDay(startDate, endDate.subtract({ days: 1 }))) {
							endDate = endDate.subtract({ days: 1 });
						}
					}

					allDay = v;
				}
			}
		/>
		<Label for="date-range-all-day">All day</Label>
	</div>
</fieldset>
