import Item, { type AccordionItemProps } from "./accordion-item.svelte";
import Root, { type AccordionProps } from "./accordion.svelte";

export type { AccordionProps, AccordionItemProps };

export const Accordion = Object.assign(Root, { Item: Item as typeof Item }) as typeof Root & {
	Item: typeof Item;
};
