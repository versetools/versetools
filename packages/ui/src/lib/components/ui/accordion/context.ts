import { getContext, setContext } from "svelte";

import type { AccordionItemProps } from "./accordion-item.svelte";

export type AccordionContext = {
	variant: AccordionItemProps<any>["variant"];
	border: AccordionItemProps<any>["border"];
};

export function getAccordionContext() {
	return getContext<AccordionContext>("accordion");
}

export function setAccordionContext(ctx: AccordionContext) {
	setContext("accordion", ctx);
}
