import { getContext, setContext } from "svelte";

export type HorizontalCardBreakpoint = "lg" | "xl" | "2xl" | "3xl" | "4xl";

export type HorizontalCardContext = {
	breakpoint: HorizontalCardBreakpoint;
};

export function getHorizontalCardContext() {
	return getContext<HorizontalCardContext>("horizontal-card");
}

export function setHorizontalCardContext(ctx: HorizontalCardContext) {
	setContext("horizontal-card", ctx);
}
