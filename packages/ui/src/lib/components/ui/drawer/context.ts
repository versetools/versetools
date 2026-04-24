import { createDialog } from "@melt-ui/svelte";
import { getContext, setContext } from "svelte";

export type DrawerSide = "left" | "right";

export type DrawerContext = {
	dialog: ReturnType<typeof createDialog>;
	side: DrawerSide;
};

export function getDrawerContext() {
	return getContext<DrawerContext>("drawer");
}

export function setDrawerContext(ctx: DrawerContext) {
	setContext("drawer", ctx);
}
