import Body, { type DrawerBodyProps } from "./drawer-body.svelte";
import Close, { type DrawerCloseProps } from "./drawer-close.svelte";
import Description, { type DrawerDescriptionProps } from "./drawer-description.svelte";
import Footer, { type DrawerFooterProps } from "./drawer-footer.svelte";
import Header, { type DrawerHeaderProps } from "./drawer-header.svelte";
import Overlay, { type DrawerOverlayProps } from "./drawer-overlay.svelte";
import Portal, { type DrawerPortalProps } from "./drawer-portal.svelte";
import Title, { type DrawerTitleProps } from "./drawer-title.svelte";
import Root, { type DrawerProps } from "./drawer.svelte";

export type {
	DrawerProps,
	DrawerPortalProps,
	DrawerOverlayProps,
	DrawerCloseProps,
	DrawerHeaderProps,
	DrawerBodyProps,
	DrawerFooterProps,
	DrawerTitleProps,
	DrawerDescriptionProps
};

export const Drawer = Object.assign(Root, {
	Portal,
	Overlay,
	Close,
	Header,
	Body,
	Footer,
	Title,
	Description
}) as typeof Root & {
	Portal: typeof Portal;
	Overlay: typeof Overlay;
	Close: typeof Close;
	Header: typeof Header;
	Body: typeof Body;
	Footer: typeof Footer;
	Title: typeof Title;
	Description: typeof Description;
};
