<script lang="ts" module>
	export type AccordionProps<TMultiple extends boolean = false> = {
		as?: "div" | "section";
		class?: string;
		variant?: AccordionItemProps<any>["variant"];
		border?: boolean;
		open?: TMultiple extends true ? string[] : string | undefined;
		multiple?: TMultiple;
		disabled?: boolean;
		children?: Snippet<[AccordionBuilder<TMultiple>]>;
	} & Omit<HTMLAttributes<HTMLElement>, "children">;
</script>

<script lang="ts" generics="TMultiple extends boolean = false">
	import { Accordion as AccordionBuilder } from "melt/builders";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { SvelteSet } from "svelte/reactivity";
	import { twMerge } from "tailwind-merge";

	import type { AccordionItemProps } from "./accordion-item.svelte";
	import { setAccordionContext } from "./context";

	let {
		as = "section",
		class: className,
		variant = "primary",
		border = true,
		open = $bindable(),
		disabled,
		multiple,
		children,
		...rest
	}: AccordionProps<TMultiple> = $props();

	setAccordionContext({
		get variant() {
			return variant;
		},
		get border() {
			return border;
		}
	});

	const accordion = $derived(
		new AccordionBuilder({
			disabled,
			multiple,
			value: open,
			onValueChange(value) {
				if (value instanceof SvelteSet) {
					open = Array.from(value.values()) as TMultiple extends true
						? string[]
						: string | undefined;
				} else {
					open = value as string | undefined as TMultiple extends true
						? string[]
						: string | undefined;
				}
			}
		})
	);
</script>

<svelte:element
	this={as}
	{...accordion.root}
	{...rest}
	class={twMerge("flex w-full flex-col", className)}
>
	{#key accordion.disabled}
		{@render children?.(accordion)}
	{/key}
</svelte:element>
