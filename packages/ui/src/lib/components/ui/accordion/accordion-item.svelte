<script lang="ts" module>
	const variants = tv({
		base: "group/accordion-item flex flex-col not-last:[--content-bg-visibility:hidden] first:[--round-top:var(--radius-md)] last:[--round-bottom:var(--radius-md)]",
		variants: {
			variant: {
				primary:
					"[--accordion-bg:var(--color-accordion)] [--accordion-border:var(--color-accordion-border)] [--accordion-inner-bg:var(--color-accordion-inner)] [--accordion-inner-text:var(--color-accordion-inner-text)] [--accordion-text:var(--color-accordion-text)]",
				secondary:
					"[--accordion-bg:var(--color-accordion-secondary)] [--accordion-border:var(--color-accordion-secondary-border)] [--accordion-inner-bg:var(--color-accordion-secondary-inner)] [--accordion-inner-text:var(--color-accordion-secondary-inner-text)] [--accordion-text:var(--color-accordion-secondary-text)]",
				light:
					"[--accordion-bg:var(--color-accordion-light)] [--accordion-border:var(--color-accordion-light-border)] [--accordion-inner-bg:var(--color-accordion-light-inner)] [--accordion-inner-text:var(--color-accordion-light-inner-text)] [--accordion-text:var(--color-accordion-light-text)]"
			}
		}
	});

	type Variant = VariantProps<typeof variants>;

	export type AccordionItemProps<TMeta extends AccordionItemMeta> = {
		class?: string;
		"heading-class"?: string;
		"button-class"?: string;
		"content-class"?: string;
		border?: boolean;
		accordion: Accordion<boolean>;
		meta?: TMeta;
	} & Variant &
		HTMLButtonAttributes &
		({ title: string; heading?: undefined } | { title?: undefined; heading: Snippet });
</script>

<script lang="ts" generics="TMeta extends AccordionItemMeta">
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import type { Accordion, AccordionItemMeta } from "melt/builders";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { slide } from "svelte/transition";
	import { twMerge } from "tailwind-merge";
	import { tv, type VariantProps } from "tailwind-variants";

	import StyledRect from "$lib/components/ui/styled-rect.svelte";

	import { getAccordionContext } from "./context";
	import Heading from "../heading.svelte";

	const ctx = getAccordionContext();

	let {
		title,
		heading,
		class: className,
		"heading-class": headingClass,
		"button-class": buttonClass,
		"content-class": contentClass,
		variant = ctx.variant,
		border = ctx.border,
		accordion,
		meta = { id: crypto.randomUUID() } as TMeta,
		children,
		...rest
	}: AccordionItemProps<TMeta> = $props();

	const item = accordion.getItem(meta);
</script>

<div class={twMerge(variants({ variant }), className)}>
	<Heading as="h3" size="base" {...item.heading} class={headingClass}>
		<button
			type="button"
			{...item.trigger}
			{...rest}
			class={twMerge(
				"accordion-item-trigger flex w-full cursor-pointer items-center rounded-t-(--round-top) border-b-1 border-(--accordion-border) bg-(--accordion-bg) p-4 text-left font-medium text-(--accordion-text) data-[state='closed']:rounded-b-(--round-bottom)",
				buttonClass,
				border && "border-x-1 group-first/accordion-item:border-t-1",
				!item.isExpanded && !border && "group-last/accordion-item:border-0"
			)}
		>
			{#if heading}
				{@render heading()}
			{:else}
				{title}
			{/if}
			<ChevronDownIcon
				class={twMerge("ml-auto size-5 shrink-0", item.isExpanded ? "rotate-180" : "")}
			/>
		</button>
	</Heading>
	{#if item.isExpanded}
		<div
			{...item.content}
			class={twMerge(
				"relative overflow-hidden rounded-b-(--round-bottom) border-b-1 border-(--accordion-border) bg-(--accordion-inner-bg) p-4 text-sm font-medium text-(--accordion-inner-text) group-last/accordion-item:border-0 group-last/accordion-item:bg-transparent",
				contentClass
			)}
			transition:slide={{ duration: 200 }}
		>
			<StyledRect
				class="[visibility:var(--content-bg-visibility)] absolute top-0 left-0 h-full w-full"
				corners="none large"
				bg="--accordion-inner-bg"
				rounded="large"
				connect="top"
			/>
			<div class="relative">
				{@render children?.()}
			</div>
		</div>
	{/if}
</div>
