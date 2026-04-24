import Body, { type DialogBodyProps } from "./dialog-body.svelte";
import Close, { type DialogCloseProps } from "./dialog-close.svelte";
import Description, { type DialogDescriptionProps } from "./dialog-description.svelte";
import Footer, { type DialogFooterProps } from "./dialog-footer.svelte";
import Header, { type DialogHeaderProps } from "./dialog-header.svelte";
import Overlay, { type DialogOverlayProps } from "./dialog-overlay.svelte";
import Portal, { type DialogPortalProps } from "./dialog-portal.svelte";
import Title, { type DialogTitleProps } from "./dialog-title.svelte";
import Root, { type DialogProps } from "./dialog.svelte";

export type {
	DialogProps,
	DialogPortalProps,
	DialogOverlayProps,
	DialogCloseProps,
	DialogHeaderProps,
	DialogBodyProps,
	DialogTitleProps,
	DialogDescriptionProps,
	DialogFooterProps
};

export const Dialog = Object.assign(Root, {
	Portal,
	Overlay,
	Close,
	Header,
	Body,
	Title,
	Description,
	Footer
}) as typeof Root & {
	Portal: typeof Portal;
	Overlay: typeof Overlay;
	Close: typeof Close;
	Header: typeof Header;
	Body: typeof Body;
	Title: typeof Title;
	Description: typeof Description;
	Footer: typeof Footer;
};
