<script lang="ts" module>
	export type DurationSelectProps = {
		value?: TimeDuration | null;
	} & Omit<
		ComboboxProps<TimeDuration, { name: string; value: TimeDuration }, false>,
		"value" | "options"
	>;
</script>

<script lang="ts">
	import type { TimeDuration } from "@internationalized/date";

	import Combobox, { type ComboboxProps } from "./combobox.svelte";
	import DurationInput from "./duration-input/duration-input.svelte";

	let { value = $bindable(), ...rest }: DurationSelectProps = $props();

	const options = $derived(
		Array.from({ length: 25 })
			.flatMap((_, h) =>
				Array.from({ length: h === 24 ? 1 : h === 0 ? 3 : 4 }).map((_, q) => ({
					hours: h,
					minutes: (h === 0 ? q + 1 : q) * 15
				}))
			)
			.map((duration) => ({
				name: `${duration.hours ? `${duration.hours}h ` : ""}${duration.minutes}m`,
				value: duration
			}))
	);

	function getClosestOption(duration?: TimeDuration | null) {
		if (!duration) return;
		return options.find(
			(opt) =>
				opt.value.hours === duration.hours &&
				(duration.minutes ?? 0) >= opt.value.minutes &&
				(duration.minutes ?? 0) < opt.value.minutes + 15
		);
	}

	const highlighted = $derived(getClosestOption(value)?.value);
</script>

<Combobox option-class="justify-center" {...rest} {options} {highlighted} showAllOptions bind:value>
	{#snippet customInput({ combobox, value, props })}
		<DurationInput
			class="py-2.5 pl-4 pr-10"
			{...props}
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
