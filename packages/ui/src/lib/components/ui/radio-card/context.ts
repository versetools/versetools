import type { RadioGroup } from "melt/builders";
import { getContext, setContext } from "svelte";

export type RadioCardContext = {
	option: string;
	item: ReturnType<RadioGroup["getItem"]>;
};

export function getRadioCardContext() {
	return getContext<RadioCardContext>("radio-card");
}

export function setRadioCardContext(ctx: RadioCardContext) {
	setContext("radio-card", ctx);
}
