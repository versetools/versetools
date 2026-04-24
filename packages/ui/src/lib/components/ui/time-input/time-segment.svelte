<script lang="ts">
	import { Time } from "@internationalized/date";

	import { keyboard } from "$lib/builders/utils/keyboard";

	let {
		id,
		ref = $bindable(),
		field,
		min,
		max,
		hourCycle,
		time,
		defaultTime,
		setValue,
		nextElement,
		prevElement,
		canBackspaceToPrev
	}: {
		id?: string;
		ref?: HTMLInputElement | null;
		field: "hour" | "minute";
		min: number;
		max: number;
		hourCycle?: 12 | 24;
		time: Time | null;
		defaultTime: Time;
		setValue: (time: Time) => void;
		nextElement?: HTMLElement | null;
		prevElement?: HTMLElement | null;
		canBackspaceToPrev?: boolean;
	} = $props();
</script>

<label for={id}>
	<input
		{id}
		bind:this={ref}
		type="text"
		role="spinbutton"
		inputmode="numeric"
		pattern="\d*"
		minlength="0"
		maxlength="2"
		autocorrect="off"
		enterkeyhint="next"
		aria-label="{field}, "
		aria-valuemin={min}
		aria-valuemax={max}
		aria-valuenow={time?.[field] ?? min}
		aria-valuetext={time?.[field].toString() ?? "--"}
		placeholder="--"
		class="no-number-buttons w-5 text-center tabular-nums caret-transparent"
		bind:value={
			() => {
				if (!time) return "";

				let value = (time ?? defaultTime)[field];
				return Math.max(min, Math.min(max, value)).toString().padStart(2, "0");
			},
			(v) => {
				if (v === "--") return;
				let value = parseInt(v);
				if ((time ?? defaultTime)[field] > max) {
					value += max;
				}

				setValue(
					(time ?? defaultTime).set({
						[field]: Math.max(min, Math.min(max, isNaN(value) ? min : value))
					})
				);
			}
		}
		onkeydown={(e) => {
			time = time ?? defaultTime;

			switch (e.key) {
				case keyboard.ARROW_UP:
					e.preventDefault();
					if (max && time[field] >= max) {
						setValue(time.set({ [field]: min }));
					} else {
						setValue(time.cycle(field, 1, { hourCycle }));
					}
					return;
				case keyboard.ARROW_DOWN:
					e.preventDefault();
					if (min && time[field] <= min) {
						setValue(time.set({ [field]: max }));
					} else {
						setValue(time.cycle(field, -1, { hourCycle }));
					}
					return;
				case keyboard.ARROW_LEFT:
					e.preventDefault();
					prevElement?.focus();
					return;
				case keyboard.ARROW_RIGHT:
					e.preventDefault();
					nextElement?.focus();
					return;
				case keyboard.BACKSPACE:
					if (canBackspaceToPrev && time[field] === min) {
						prevElement?.focus();
						return;
					} else if (time[field] < 10) {
						e.preventDefault();
						setValue(time.set({ [field]: min }));
						return;
					}
			}

			if (!isNaN(parseInt(e.key))) {
				const value = time[field];
				if (value.toString().length === 2 || value === max) {
					nextElement?.focus();
					setValue(time.set({ minute: parseInt(e.key) }));
				} else {
					const total = parseInt(value.toString() + e.key);
					setValue(time.set({ [field]: total }));
				}

				e.preventDefault();
				return;
			}
		}}
	/>
</label>

<style>
	label {
		position: relative;
	}

	label::after {
		content: "";
		position: absolute;
		top: -10px;
		left: -4px;
		right: -4px;
		bottom: -10px;
		pointer-events: auto;
	}
</style>
