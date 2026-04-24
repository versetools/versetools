import { getContext, setContext } from "svelte";

import type { CardProps } from "../ui";

export type ConfirmationDialogContext = {
	open?: boolean;
	closing: boolean;
	variant?: CardProps["variant"];
	confirmationInput?: string;
	inputValue?: string;
};

export function getConfirmationDialogContext() {
	return getContext<ConfirmationDialogContext>("confirmation-dialog");
}

export function setConfirmationDialogContext(ctx: ConfirmationDialogContext) {
	setContext("confirmation-dialog", ctx);
}
