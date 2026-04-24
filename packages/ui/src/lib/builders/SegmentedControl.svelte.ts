import { dequal } from "dequal";
import type { Getter, MaybeGetter } from "melt";
import type { HTMLAttributes, HTMLInputAttributes, HTMLLabelAttributes } from "svelte/elements";

import { dataAttr, disabledAttr, idAttr } from "./utils/attribute";
import { extract } from "./utils/extract";
import { createBuilderMetadata } from "./utils/identifiers";
import { isHtmlElement } from "./utils/is";
import { getDirectionalKeys, keyboard } from "./utils/keyboard";
import { unique } from "./utils/string";
import { Synced } from "./utils/Synced.svelte";

const metadata = createBuilderMetadata("segmented-control", [
	"root",
	"label",
	"item",
	"hidden-input"
]);

export type SegmentedControlProps<T> = {
	/**
	 * If `true`, prevents the user from interacting with the control.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;
	/**
	 * If `true`, indicates that the user must select a radio button before
	 * the owning form can be submitted.
	 *
	 * @default false
	 */
	required?: MaybeGetter<boolean | undefined>;
	/**
	 * If the button selection should loop when navigating with the arrow keys.
	 *
	 * @default true
	 */
	loop?: MaybeGetter<boolean | undefined>;
	/**
	 * If the selection should only be changed by clicking the whole control.
	 *
	 * @default false
	 */
	cycle?: MaybeGetter<boolean | undefined>;
	/**
	 * If `true`, the value will be changed whenever a button is focused.
	 *
	 * @default true
	 */
	selectWhenFocused?: MaybeGetter<boolean | undefined>;
	/**
	 * The orientation of the control.
	 *
	 * @default "horizontal"
	 */
	orientation?: MaybeGetter<"horizontal" | "vertical" | undefined>;
	/**
	 * Default value for segmented control.
	 */
	defaultValue?: MaybeGetter<T | undefined>;
	/**
	 * The value for the segmented control.
	 *
	 * When passing a getter, it will be used as source of truth,
	 * meaning that the value only changes when the getter returns a new value.
	 *
	 * Otherwise, if passing a static value, it'll serve as the default value.
	 */
	value?: MaybeGetter<T | undefined>;
	/**
	 * Called when the radio button is clicked.
	 */
	onValueChange?: (value: T) => void;
	/**
	 * The ids to use for the segmented control elements.
	 */
	ids?: MaybeGetter<Partial<ReturnType<typeof metadata.createIds>> | undefined>;
};

export class SegmentedControl<T> {
	/* Props */
	#props!: SegmentedControlProps<T>;
	readonly disabled = $derived(extract(this.#props.disabled, false));
	readonly required = $derived(extract(this.#props.required, false));
	readonly loop = $derived(extract(this.#props.loop, true));
	readonly cycle = $derived(extract(this.#props.cycle, false));
	readonly selectWhenFocused = $derived(extract(this.#props.selectWhenFocused, true));
	readonly orientation = $derived(extract(this.#props.orientation, "horizontal"));

	/* State */
	#value: Synced<T>;
	#highlighted: Synced<T | null>;
	ids = $state(metadata.createIds());

	constructor(props: SegmentedControlProps<T>) {
		this.#props = props;
		this.#value = new Synced({
			value: props.value,
			onChange: props.onValueChange,
			defaultValue: extract(props.defaultValue) as T
		});
		this.#highlighted = new Synced<T | null>({
			value: null,
			defaultValue: null
		});
		this.ids = {
			...this.ids,
			...extract(props.ids, {})
		};
	}

	get value() {
		return this.#value.current;
	}

	set value(value: T) {
		this.#value.current = value;
	}

	get highlighted() {
		return this.#highlighted.current;
	}

	set highlighted(value: T | null) {
		this.#highlighted.current = value;
	}

	get #sharedAttrs() {
		return {
			"data-orientation": dataAttr(this.orientation),
			"data-disabled": disabledAttr(this.disabled),
			"data-value": this.value
		};
	}

	get root() {
		return {
			...this.#sharedAttrs,
			[metadata.dataAttrs["root"]]: "",
			id: this.ids.root,
			role: "radiogroup",
			"aria-required": this.required,
			"aria-activedescendant": this.highlighted ? this.getItemId(this.highlighted) : undefined,
			tabindex: this.cycle ? 0 : undefined,
			onclick: !this.cycle
				? undefined
				: (e) => {
						const root = e.currentTarget;
						const items = Array.from(root.querySelectorAll(metadata.dataSelectors.item)).filter(
							(el): el is HTMLElement => isHtmlElement(el) && !el.hasAttribute("data-disabled")
						);

						const currentItem = root.querySelector(
							`#${this.ids.item}-${this.getItemId(this.value)}`
						);
						const currentIdx = isHtmlElement(currentItem) ? items.indexOf(currentItem) : -1;
						const nextIdx = currentIdx + 1;

						let itemToSelect: HTMLElement | undefined;
						if (nextIdx >= items.length && this.loop) {
							itemToSelect = items[0];
						} else {
							itemToSelect = items[nextIdx];
						}

						if (!itemToSelect) return;

						e.preventDefault();
						itemToSelect.focus();
						this.selectItem(itemToSelect);
					},
			onkeydown: !this.cycle
				? undefined
				: (e) => {
						const root = e.currentTarget;
						const items = Array.from(root.querySelectorAll(metadata.dataSelectors.item)).filter(
							(el): el is HTMLElement => isHtmlElement(el) && !el.hasAttribute("data-disabled")
						);

						const currentItem = root.querySelector(
							`#${this.ids.item}-${this.getItemId(this.value)}`
						);
						const currentIdx = isHtmlElement(currentItem) ? items.indexOf(currentItem) : -1;

						const style = window.getComputedStyle(root);
						const dir = style.getPropertyValue("direction") as "ltr" | "rtl";
						const { nextKey, prevKey } = getDirectionalKeys(dir, this.orientation);

						let itemToSelect: HTMLElement | undefined;
						switch (e.key) {
							case nextKey: {
								e.preventDefault();
								const nextIdx = currentIdx + 1;
								if (nextIdx >= items.length && this.loop) {
									itemToSelect = items[0];
								} else {
									itemToSelect = items[nextIdx];
								}
								break;
							}
							case prevKey: {
								e.preventDefault();
								const prevIdx = currentIdx - 1;
								if (prevIdx < 0 && this.loop) {
									itemToSelect = items[items.length - 1];
								} else {
									itemToSelect = items[prevIdx];
								}
								break;
							}
							case keyboard.HOME: {
								e.preventDefault();
								itemToSelect = items[0];
								break;
							}
							case keyboard.END: {
								e.preventDefault();
								itemToSelect = items[items.length - 1];
								break;
							}
							default: {
								return;
							}
						}

						if (itemToSelect) {
							itemToSelect.focus();
							this.selectItem(itemToSelect);
						}
					}
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	getItemId(value: T) {
		return idAttr(unique(value));
	}

	getItem(item: T) {
		return new SegmentedControlItem({
			control: this,
			id: this.getItemId(item),
			item,
			getSharedAttrs: () => this.#sharedAttrs
		});
	}

	get hiddenInput() {
		return {
			[metadata.dataAttrs["hidden-input"]]: "",
			disabled: this.disabled,
			required: this.required,
			hidden: true,
			"aria-hidden": true,
			tabindex: -1,
			value: JSON.stringify(dataAttr(this.value))
		} as const satisfies HTMLInputAttributes;
	}

	select(item: T) {
		if (this.disabled) return;
		this.value = item;
	}

	selectItem(item: HTMLElement) {
		const value = (
			item.dataset.value === "" ? true : item.dataset.value ? JSON.parse(item.dataset.value) : false
		) as T;
		if (value === undefined) return;

		this.select(value);
	}
}

type SegmentedControlItemProps<T> = {
	control: SegmentedControl<T>;
	id: string;
	item: T;
	getSharedAttrs: Getter<HTMLAttributes<HTMLElement>>;
};

class SegmentedControlItem<T> {
	/* Props */
	#props!: SegmentedControlItemProps<T>;
	#control = $derived(this.#props.control);
	readonly id = $derived(this.#props.id);
	readonly value = $derived(this.#props.item);
	readonly checked = $derived(this.#control.value === this.value);
	readonly highlighted = $derived(dequal(this.#control.highlighted, this.value));

	constructor(props: SegmentedControlItemProps<T>) {
		this.#props = props;
	}

	#select(e: Event) {
		if (this.#control.disabled) return;

		this.#control.select(this.value);

		const el = e.currentTarget;
		if (!isHtmlElement(el)) return;
		const root = el.closest(metadata.dataSelectors.root);
		if (!isHtmlElement(root)) return;
		const item = root.querySelector(`#${this.#control.getItemId(this.value)}`);
		if (isHtmlElement(item)) item.focus();
	}

	get label() {
		return {
			[metadata.dataAttrs.label]: "",
			id: `${this.#control.ids.label}-${this.id}`,
			for: `${this.#control.ids.item}-${this.id}`,
			"data-highlighted": dataAttr(this.highlighted),
			...(this.#control.cycle
				? {}
				: {
						onmouseenter: () => {
							this.#control.highlighted = this.value;
						},
						onmouseleave: () => {
							if (!this.highlighted) return;
							this.#control.highlighted = null;
						},
						onclick: (e) => {
							this.#select(e);
						}
					})
		} as const satisfies HTMLLabelAttributes;
	}

	get input() {
		return {
			...this.#props.getSharedAttrs(),
			[metadata.dataAttrs["item"]]: "",
			id: `${this.#control.ids.item}-${this.id}`,
			"data-value": JSON.stringify(dataAttr(this.value)),
			"data-state": dataAttr(this.checked ? "checked" : "unchecked"),
			"aria-checked": this.checked,
			"data-highlighted": dataAttr(this.highlighted),
			role: "radio",
			tabindex: this.#control.cycle ? -1 : 0,
			style:
				"position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;",
			onblur: () => {
				if (!this.highlighted) return;
				this.#control.highlighted = null;
			},
			...(this.#control.cycle
				? {}
				: {
						onfocus: () => {
							this.#control.highlighted = this.value;
						},
						onkeydown: (e) => {
							if (e.key === keyboard.SPACE) {
								e.preventDefault();
								this.#select(e);
								return;
							}

							const el = e.currentTarget;
							const root = el.closest(metadata.dataSelectors.root);
							if (!isHtmlElement(root)) return;

							const items = Array.from(root.querySelectorAll(metadata.dataSelectors.item)).filter(
								(el): el is HTMLElement => isHtmlElement(el) && !el.hasAttribute("data-disabled")
							);
							const currentIdx = items.indexOf(el);
							const loop = this.#control.loop;

							const style = window.getComputedStyle(el);
							const dir = style.getPropertyValue("direction") as "ltr" | "rtl";
							const { nextKey, prevKey } = getDirectionalKeys(dir, this.#control.orientation);

							let itemToFocus: HTMLElement | undefined;
							switch (e.key) {
								case nextKey: {
									e.preventDefault();
									const nextIdx = currentIdx + 1;
									if (nextIdx >= items.length && loop) {
										itemToFocus = items[0];
									} else {
										itemToFocus = items[nextIdx];
									}
									break;
								}
								case prevKey: {
									e.preventDefault();
									const prevIdx = currentIdx - 1;
									if (prevIdx < 0 && loop) {
										itemToFocus = items[items.length - 1];
									} else {
										itemToFocus = items[prevIdx];
									}
									break;
								}
								case keyboard.HOME: {
									e.preventDefault();
									itemToFocus = items[0];
									break;
								}
								case keyboard.END: {
									e.preventDefault();
									itemToFocus = items[items.length - 1];
									break;
								}
								default: {
									return;
								}
							}

							if (itemToFocus) {
								itemToFocus.focus();
								if (this.#control.selectWhenFocused) {
									this.#control.selectItem(itemToFocus);
								}
							}
						}
					})
		} as const satisfies HTMLAttributes<HTMLElement>;
	}
}

export type { SegmentedControlItem };
