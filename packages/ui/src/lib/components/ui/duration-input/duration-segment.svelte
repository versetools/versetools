<script lang="ts">
	import type { TimeDuration } from "@internationalized/date";

	import { keyboard } from "$lib/builders/utils/keyboard";

	let {
		id,
		ref = $bindable(),
		field,
		prevField,
		duration = $bindable(),
		min,
		max,
		nextElement,
		prevElement,
		canBackspaceToPrev
	}: {
		id?: string;
		ref?: HTMLInputElement | null;
		field: "hours" | "minutes";
		prevField?: "hours" | "minutes";
		duration?: TimeDuration | null;
		min: number;
		max?: number;
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
		aria-valuenow={duration?.[field] ?? min}
		aria-valuetext={duration?.[field]?.toString() ?? "-"}
		placeholder="-"
		class="no-number-buttons min-w-3 text-center tabular-nums caret-transparent"
		style="width: {(duration?.[field] ?? min).toString().length * 9}px;"
		bind:value={
			() => {
				if (!duration) return "";

				const value = duration[field] ?? min;
				return Math.max(min, Math.min(max ?? Infinity, value)).toString();
			},
			(v) => {
				if (v === "--") return;
				let value = parseInt(v);

				duration = {
					...duration,
					[field]: Math.max(min, Math.min(max ?? Infinity, isNaN(value) ? min : value))
				};
			}
		}
		onkeydown={(e) => {
			duration ??= { hours: 0, minutes: 0 };
			const value = duration[field] ?? min;

			switch (e.key) {
				case keyboard.ARROW_UP: {
					e.preventDefault();
					const inc = e.shiftKey ? 10 : 1;
					if (max && value + inc >= max) {
						duration = {
							...duration,
							[field]: min
						};
						if (prevField) {
							duration = {
								...duration,
								[prevField]: (duration[prevField] ?? 0) + 1
							};
						}
					} else {
						duration = {
							...duration,
							[field]: value + inc
						};
					}
					return;
				}
				case keyboard.ARROW_DOWN: {
					e.preventDefault();
					const dec = e.shiftKey ? -10 : -1;
					if (value + dec <= min) {
						duration = {
							...duration,
							[field]: max
						};
						if (prevField) {
							duration = {
								...duration,
								[prevField]: Math.max(0, (duration[prevField] ?? 0) - 1)
							};
						}
					} else {
						duration = {
							...duration,
							[field]: value + dec
						};
					}
					return;
				}
				case keyboard.ARROW_LEFT:
					e.preventDefault();
					prevElement?.focus();
					return;
				case keyboard.ARROW_RIGHT:
					e.preventDefault();
					nextElement?.focus();
					return;
				case keyboard.BACKSPACE:
					if (canBackspaceToPrev && value === min) {
						prevElement?.focus();
						return;
					} else if (value < 10) {
						e.preventDefault();
						duration = {
							...duration,
							[field]: min
						};
						return;
					}
			}

			if (!isNaN(parseInt(e.key))) {
				if (value.toString().length === 2 || value === max) {
					nextElement?.focus();
					duration = {
						...duration,
						minutes: parseInt(e.key)
					};
				} else {
					const total = parseInt(value.toString() + e.key);
					duration = {
						...duration,
						[field]: total
					};
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
		left: -6px;
		right: -10px;
		bottom: -10px;
		pointer-events: auto;
	}
</style>
