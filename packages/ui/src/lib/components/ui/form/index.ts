import * as FormSnap from "formsnap";

import FieldErrors, { type FormFieldErrorsProps } from "./form-field-errors.svelte";
import Field, { type FormFieldProps } from "./form-field.svelte";
import Fieldset, { type FormFieldsetProps } from "./form-fieldset.svelte";
import Hint, { type FormHintProps } from "./form-hint.svelte";
import Label, { type FormLabelProps } from "./form-label.svelte";
import Legend, { type FormLegendProps } from "./form-legend.svelte";
import Root, { type FormProps } from "./form.svelte";

export type {
	FormProps,
	FormFieldErrorsProps,
	FormFieldProps,
	FormFieldsetProps,
	FormHintProps,
	FormLabelProps,
	FormLegendProps
};

const Control = FormSnap.Control;

export const Form = Object.assign(Root, {
	Control,
	Field: Field as typeof Field,
	Fieldset: Fieldset as typeof Fieldset,
	FieldErrors,
	Label,
	Legend,
	Hint
}) as typeof Root & {
	Control: typeof Control;
	Field: typeof Field;
	Fieldset: typeof Fieldset;
	FieldErrors: typeof FieldErrors;
	Label: typeof Label;
	Legend: typeof Legend;
	Hint: typeof Hint;
};
