import { createDialog } from "@melt-ui/svelte";
import { getContext, setContext } from "svelte";

export type DialogContext = {
	dialog: ReturnType<typeof createDialog>;
};

export function getDialogContext() {
	return getContext<DialogContext>("dialog");
}

export function setDialogContext(ctx: DialogContext) {
	setContext("dialog", ctx);
}
