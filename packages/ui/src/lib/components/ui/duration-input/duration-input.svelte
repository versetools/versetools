<script lang="ts" module>
	export type DurationInputProps = {
		value?: TimeDuration | null;
		class?: string;
	} & HTMLFieldsetAttributes;
</script>

<script lang="ts">
	import type { TimeDuration } from "@internationalized/date";
	import type { HTMLFieldsetAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import DurationSegment from "./duration-segment.svelte";

	let { id, value = $bindable(), class: className, ...rest }: DurationInputProps = $props();

	let hourEl = $state<HTMLInputElement | null>(null);
	let minuteEl = $state<HTMLInputElement | null>(null);
</script>

<fieldset {id} class={twMerge("flex justify-center text-sm font-medium", className)} {...rest}>
	<legend class="sr-only">Duration</legend>
	<input
		type="hidden"
		value={value
			? ((value.hours ?? 0) * 3600 + (value.minutes ?? 0) * 60 + (value.seconds ?? 0)) * 1000 +
				(value.milliseconds ?? 0)
			: 0}
	/>
	<DurationSegment
		bind:ref={hourEl}
		id={id ? `${id}-hours` : undefined}
		field="hours"
		min={0}
		bind:duration={value}
		nextElement={minuteEl}
		prevElement={minuteEl}
	/>
	<span class="mr-1 select-none">h</span>
	<DurationSegment
		bind:ref={minuteEl}
		id={id ? `${id}-minutes` : undefined}
		field="minutes"
		prevField="hours"
		min={0}
		max={59}
		bind:duration={value}
		nextElement={hourEl}
		prevElement={hourEl}
		canBackspaceToPrev
	/>
	<span class="select-none">m</span>
</fieldset>
