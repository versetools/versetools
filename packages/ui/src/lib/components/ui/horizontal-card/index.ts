import Body, { type HorizontalCardBodyProps } from "./card-body.svelte";
import Header, { type HorizontalCardHeaderProps } from "./card-header.svelte";
import Root, { type HorizontalCardProps } from "./card.svelte";
import Description from "../card/card-description.svelte";
import Title from "../card/card-title.svelte";

export type { HorizontalCardProps, HorizontalCardHeaderProps, HorizontalCardBodyProps };

export const HCard = Object.assign(Root, { Header, Title, Description, Body });
