<script lang="ts">
	import type { DateValue } from "@internationalized/date";
	import { twMerge } from "tailwind-merge";

	import { keyboard } from "$lib/builders/utils/keyboard";

	import { getPlaceholder } from "./placeholders";

	let {
		id,
		ref = $bindable(),
		locale = "en",
		field,
		lastField,
		min,
		max,
		date = $bindable(),
		defaultDate,
		nextElement,
		prevElement,
		canBackspaceToPrev
	}: {
		id?: string;
		ref?: HTMLInputElement | null;
		locale?: string;
		field: "day" | "month" | "year";
		lastField: "day" | "month" | "year";
		min: number;
		max?: number;
		date?: DateValue | null;
		defaultDate: DateValue;
		nextElement?: HTMLElement | null;
		prevElement?: HTMLElement | null;
		canBackspaceToPrev?: boolean;
	} = $props();

	const maxlength = $derived(field === "year" ? 4 : 2);
</script>

<input
	{id}
	bind:this={ref}
	type="text"
	role="spinbutton"
	inputmode="numeric"
	pattern="\d*"
	minlength="0"
	{maxlength}
	autocorrect="off"
	enterkeyhint="next"
	aria-label="{field}, "
	aria-valuemin={min}
	aria-valuemax={max}
	aria-valuenow={date?.[field] ?? min}
	aria-valuetext={date?.[field].toString() ?? getPlaceholder(locale, field)}
	placeholder={getPlaceholder(locale, field)}
	class={twMerge(
		"no-number-buttons field-sizing-content text-center tabular-nums caret-transparent",
		field === "year" && "not-supports-[field-sizing:content]:w-10",
		field === "month" && "not-supports-[field-sizing:content]:w-8",
		field === "day" && "not-supports-[field-sizing:content]:w-8"
	)}
	bind:value={
		() => {
			if (!date) return "";
			let value = date?.[field] ?? min;
			if (max && value > max) {
				value -= max;
			}
			return value.toString().padStart(maxlength, "0");
		},
		(v) => {
			if (v === getPlaceholder(locale, field)) return;
			let value = parseInt(v);
			if (max && (date?.[field] ?? min) > max) {
				value += max;
			}

			date = (date ?? defaultDate).set({
				[field]: Math.max(min, Math.min(max ?? Infinity, isNaN(value) ? min : value))
			});
		}
	}
	onclick={(e) => {
		e.currentTarget.focus();
		e.stopPropagation();
	}}
	onkeydown={(e) => {
		date = date ?? defaultDate;
		const value = date[field];

		switch (e.key) {
			case keyboard.ARROW_UP: {
				e.preventDefault();
				const inc = e.shiftKey ? 10 : 1;
				if (max && value + inc > max) {
					date = date.set({ [field]: max });
				} else {
					date = date.cycle(field, inc);
				}
				return;
			}
			case keyboard.ARROW_DOWN: {
				e.preventDefault();
				const dec = e.shiftKey ? -10 : -1;
				if (value + dec < min) {
					date = date.set({ [field]: min });
				} else {
					date = date.cycle(field, dec);
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
					date = date.set({ [field]: min });
					return;
				}
		}

		if (!isNaN(parseInt(e.key))) {
			if (value.toString().length === maxlength || value === max) {
				nextElement?.focus();
				date = date.set({ [lastField]: parseInt(e.key) });
			} else {
				const total = parseInt(value.toString() + e.key);
				date = date.set({ [field]: total });
			}

			e.preventDefault();
			return;
		}
	}}
/>
