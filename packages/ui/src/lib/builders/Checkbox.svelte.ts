import type { MaybeGetter } from "melt";
import type { HTMLButtonAttributes } from "svelte/elements";

import { disabledAttr } from "./utils/attribute";
import { extract } from "./utils/extract";
import { createDataIds } from "./utils/identifiers";
import { keyboard } from "./utils/keyboard";
import { Synced } from "./utils/Synced.svelte";

const identifiers = createDataIds("checkbox", ["trigger", "hidden-input"]);

export type CheckboxProps = {
	indeterminateWhen?: MaybeGetter<boolean | undefined>;

	/**
	 * The value for the Checkbox.
	 *
	 * When passing a getter, it will be used as source of truth,
	 * meaning that the value only changes when the getter returns a new value.
	 *
	 * Otherwise, if passing a static value, it'll serve as the default value.
	 *
	 *
	 * @default false
	 */
	value?: MaybeGetter<boolean | "indeterminate">;
	/**
	 * Called when the value is supposed to change.
	 */
	onValueChange?: (value: boolean | "indeterminate") => void;

	/**
	 * If `true`, prevents the user from interacting with the input.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;
};

export class Checkbox {
	/* Props */
	#props!: CheckboxProps;
	readonly indeterminateWhen = $derived(extract(this.#props.indeterminateWhen, undefined));
	readonly disabled = $derived(extract(this.#props.disabled, false));

	/* State */
	#value!: Synced<boolean | "indeterminate">;

	constructor(props: CheckboxProps = {}) {
		this.#value = new Synced({
			value: props.value,
			onChange: props.onValueChange,
			defaultValue: false
		});
		this.#props = props;
	}

	get value() {
		return this.#value.current;
	}

	set value(value) {
		this.#value.current = value;
	}

	#toggle() {
		if (this.indeterminateWhen === undefined) {
			this.value = !this.value;
			return;
		}

		if (this.value === "indeterminate" || this.value === this.indeterminateWhen) {
			this.value = !this.indeterminateWhen;
		} else {
			this.value = "indeterminate";
		}
	}

	/** The trigger that toggles the value. */
	get trigger() {
		return {
			[identifiers.trigger]: "",
			role: "checkbox",
			tabindex: 0,
			"aria-checked": this.value === "indeterminate" ? "mixed" : `${this.value}`,
			disabled: disabledAttr(this.disabled),
			onclick: () => {
				if (this.disabled) return;
				this.#toggle();
			},
			onkeydown: (e) => {
				if (e.key === keyboard.SPACE) {
					e.preventDefault();
					this.#toggle();
					return;
				}
			}
		} as const satisfies HTMLButtonAttributes;
	}

	/** A hidden input field to use within forms. */
	get hiddenInput() {
		return {
			[identifiers["hidden-input"]]: "",
			type: "hidden",
			value: this.value === "indeterminate" ? "indeterminate" : this.value ? "on" : "off"
		} as const;
	}
}
