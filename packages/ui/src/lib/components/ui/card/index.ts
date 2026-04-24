import Body, { type CardBodyProps } from "./card-body.svelte";
import Description, { type CardDescriptionProps } from "./card-description.svelte";
import Footer, { type CardFooterProps } from "./card-footer.svelte";
import Header, { type CardHeaderProps } from "./card-header.svelte";
import Title, { type CardTitleProps } from "./card-title.svelte";
import Root, { type CardProps, type BaseCardProps } from "./card.svelte";

export type {
	CardProps,
	BaseCardProps,
	CardHeaderProps,
	CardTitleProps,
	CardDescriptionProps,
	CardBodyProps,
	CardFooterProps
};

export const Card = Object.assign(Root, {
	Header,
	Title,
	Description,
	Body,
	Footer
}) as typeof Root & {
	Header: typeof Header;
	Title: typeof Title;
	Description: typeof Description;
	Body: typeof Body;
	Footer: typeof Footer;
};
