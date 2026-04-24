import Option, { type RadioGroupOptionProps } from "./radio-group-option.svelte";
import Root, { type RadioGroupProps } from "./radio-group.svelte";

export type { RadioGroupProps, RadioGroupOptionProps };

export const RadioGroup = Object.assign(Root, { Option }) as typeof Root & {
	Option: typeof Option;
};
