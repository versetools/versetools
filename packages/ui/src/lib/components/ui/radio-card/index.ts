import Header, { type RadioCardHeaderProps } from "./card-header.svelte";
import Root, { type RadioCardProps } from "./card.svelte";
import Body from "../card/card-body.svelte";
import Description from "../card/card-description.svelte";
import Title from "../card/card-title.svelte";

export type { RadioCardProps, RadioCardHeaderProps };

export const RadioCard = Object.assign(Root, {
	Header,
	Title,
	Description,
	Body
}) as typeof Root & {
	Header: typeof Header;
	Title: typeof Title;
	Description: typeof Description;
	Body: typeof Body;
};
