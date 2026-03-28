import type { Err, Ok, ReturnResult } from "@l3dev/result";
import type { defaultMessages, MessageData } from "@versetools/core/errors";
import type { MaybePromise } from "@versetools/core/utility-types";
import { toast } from "@versetools/ui";
import { fromStore } from "svelte/store";
import type { FormOptions, SuperValidated } from "sveltekit-superforms";
import { superForm } from "sveltekit-superforms/client";

import { toastResultError } from "$lib/convex/errors/toast";

let unsavedChanges = $state({
	unsaved: false,
	resolve: (_value: boolean | PromiseLike<boolean>) => {}
});

export function useUnsavedChanges() {
	return {
		get unsaved() {
			return unsavedChanges.unsaved;
		},
		set unsaved(value) {
			unsavedChanges = {
				...unsavedChanges,
				unsaved: value
			};
		},
		canNavigate(value: boolean | PromiseLike<boolean>) {
			unsavedChanges.resolve(value);
		}
	};
}

export type FormActionEvent<
	T extends Record<string, unknown> = Record<string, unknown>,
	M = any,
	In extends Record<string, unknown> = T
> = {
	form: SuperValidated<T, M, In>;
	formElement: HTMLFormElement;
	cancel: () => void;
};

type UseFormOptions<
	T extends Record<string, unknown> = Record<string, unknown>,
	M = any,
	In extends Record<string, unknown> = T,
	R extends ReturnResult<any, any> = ReturnResult<any, any>
> = FormOptions<T, M, In> & {
	ignoreTainted?: boolean;
	onInvalid?: (event: {
		form: SuperValidated<T, M, In>;
		formElement: HTMLFormElement;
		cancel: () => void;
	}) => MaybePromise<void>;
} & (
		| {
				successMessage?: string | MessageData;
				errorMessage?: string;
				errorMessages?: {
					[type in
						| (R extends Err<infer TType, any> ? TType : string & {})
						| keyof typeof defaultMessages]?: Partial<MessageData>;
				};
				action: (event: FormActionEvent<T, M, In>) => MaybePromise<R | undefined>;
				onAction?: (event: {
					form: SuperValidated<T, M, In>;
					formElement: HTMLFormElement;
					result: R;
				}) => MaybePromise<void>;
				onFailure?: (event: {
					form: SuperValidated<T, M, In>;
					formElement: HTMLFormElement;
					err: Extract<R, Err<any, any>>;
				}) => MaybePromise<boolean>;
				onSuccess?: (event: {
					form: SuperValidated<T, M, In>;
					formElement: HTMLFormElement;
					result: Extract<R, Ok<any>>;
				}) => MaybePromise<void>;
		  }
		| {
				successMessage?: undefined;
				errorMessage?: undefined;
				errorMessages?: undefined;
				action?: undefined;
				onAction?: undefined;
				onFailure?: undefined;
				onSuccess?: undefined;
		  }
	);

export function useForm<
	T extends Record<string, unknown> = Record<string, unknown>,
	M = any,
	In extends Record<string, unknown> = T,
	R extends ReturnResult<any, any> = ReturnResult<any, any>
>(
	validated: SuperValidated<T, M, In>,
	{
		ignoreTainted,
		successMessage,
		errorMessage,
		errorMessages,
		onInvalid,
		action,
		onAction,
		onFailure,
		onSuccess,
		...formOptions
	}: UseFormOptions<T, M, In, R>
) {
	let submitting = $state(false);

	const form = superForm(validated, {
		dataType: "json",
		SPA: true,
		resetForm: false,
		scrollToError: "auto",
		taintedMessage: ignoreTainted
			? undefined
			: () => {
					return new Promise<boolean>((resolve) => {
						unsavedChanges = {
							unsaved: true,
							resolve
						};
					});
				},
		...formOptions,
		async onUpdate(event) {
			try {
				let cancelled = false;
				const wrappedEvent = {
					...event,
					cancel: () => {
						cancelled = true;
						event.cancel();
					}
				};

				if (!event.form.valid) {
					await onInvalid?.(wrappedEvent);
					return;
				}

				if (!action) {
					return;
				}

				submitting = true;

				const result = await action(wrappedEvent);
				if (!result || cancelled) {
					return;
				}

				await onAction?.({ ...event, result });

				if (!result.ok) {
					const handled = await onFailure?.({ ...event, err: result as Extract<R, Err<any, any>> });
					if (handled) {
						return;
					}

					toastResultError(
						result,
						errorMessage ?? "An error occurred, please try again",
						errorMessages
					);
					return;
				}

				if (successMessage) {
					if (typeof successMessage === "string") {
						toast({
							variant: "success",
							title: successMessage
						});
					} else {
						toast({
							variant: "success",
							...successMessage
						});
					}
				}

				await onSuccess?.({ ...event, result: result as Extract<R, Ok<any>> });
			} finally {
				submitting = false;

				await formOptions.onUpdate?.(event);
			}
		}
	});

	const { form: formData, tainted: taintedFields, isTainted } = form;

	const tainted = $derived(isTainted(fromStore(taintedFields).current));

	return {
		get form() {
			return form;
		},
		get formData() {
			return formData;
		},
		formState: {
			get tainted() {
				return tainted;
			},
			get submitting() {
				return submitting;
			},
			set submitting(value) {
				submitting = value;
			}
		}
	};
}
