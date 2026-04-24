import Cancel, { type ConfirmationDialogCancelProps } from "./confirmation-dialog-cancel.svelte";
import Confirm, { type ConfirmationDialogConfirmProps } from "./confirmation-dialog-confirm.svelte";
import Root, { type ConfirmationDialogProps } from "./confirmation-dialog.svelte";

export type {
	ConfirmationDialogProps,
	ConfirmationDialogCancelProps,
	ConfirmationDialogConfirmProps
};

export const ConfirmationDialog = Object.assign(Root, {
	Cancel,
	Confirm
}) as typeof Root & {
	Cancel: typeof Cancel;
	Confirm: typeof Confirm;
};
