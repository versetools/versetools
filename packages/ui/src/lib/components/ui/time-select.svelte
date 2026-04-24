<script lang="ts" module>
	export type TimeSelectProps = {
		locale?: string;
		value?: Time | null;
		min?: Time | null;
		max?: Time | null;
	} & Omit<
		ComboboxProps<Time, { name: string; value: Time }, false>,
		"value" | "options" | "min" | "max"
	>;
</script>

<script lang="ts">
	import { Time } from "@internationalized/date";

	import { browser } from "$app/environment";

	import Combobox, { type ComboboxProps } from "./combobox.svelte";
	import TimeInput from "./time-input/time-input.svelte";

	let {
		locale,
		value = $bindable(),
		min: minValue,
		max: maxValue,
		...rest
	}: TimeSelectProps = $props();

	const formatter = $derived(
		Intl.DateTimeFormat(locale ?? (browser ? navigator.language : "en"), {
			hour: "2-digit",
			minute: "2-digit"
		})
	);

	const options = $derived(
		Array.from({ length: 24 })
			.flatMap((_, h) => Array.from({ length: 4 }).map((_, q) => new Time(h, q * 15, 0)))
			.filter((time) => {
				if (minValue && time.hour * 60 + time.minute < minValue.hour * 60 + minValue.minute) {
					return false;
				}
				if (maxValue && time.hour * 60 + time.minute > maxValue.hour * 60 + maxValue.minute) {
					return false;
				}
				return true;
			})
			.map((time) => ({
				name: formatter.format(new Date(0, 0, 0, time.hour, time.minute)),
				value: time
			}))
	);

	function getClosestOption(time?: Time | null) {
		if (!time) return;
		return options.find(
			(opt) =>
				opt.value.hour === time.hour &&
				time.minute >= opt.value.minute &&
				time.minute < opt.value.minute + 15
		);
	}

	const highlighted = $derived(getClosestOption(value)?.value);
</script>

<Combobox option-class="justify-center" {...rest} {options} {highlighted} showAllOptions bind:value>
	{#snippet customInput({ combobox, value, props })}
		<TimeInput
			{locale}
			class="py-2.5 pl-4 pr-10"
			{...props}
			min={minValue}
			max={maxValue}
			bind:value={
				() => value,
				(v) => {
					combobox.value = v;

					const closestOption = getClosestOption(v);
					if (closestOption) {
						combobox.highlight(closestOption.value);
					}
				}
			}
		/>
	{/snippet}
</Combobox>
