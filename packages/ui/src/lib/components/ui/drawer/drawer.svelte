<script lang="ts" module>
	const variants = tv({
		base: "bg-drawer border-drawer-border relative flex h-full w-full flex-col",
		variants: {
			side: {
				left: "border-r",
				right: "border-l"
			} satisfies Record<DrawerSide, string>
		}
	});

	export type DrawerProps = {
		as?: "nav" | "aside";
		class?: string;
		children: Snippet;
	} & HTMLAttributes<HTMLElement>;
</script>

<script
	lang="ts"
	generics="InOutTransition extends Transition<any>, InTransition extends Transition<any>, OutTransition extends Transition<any>"
>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { fly, type FlyParams } from "svelte/transition";
	import { twMerge } from "tailwind-merge";
	import { tv } from "tailwind-variants";

	import { noop, type Transition, type TransitionsProps } from "$lib/transitions";

	import { getDrawerContext, type DrawerSide } from "./context";

	const { dialog, side } = getDrawerContext();

	let {
		as = "aside",
		class: className,
		children,
		transition = fly as InOutTransition,
		transitionParams = {
			x: side === "left" ? "-100%" : "100%",
			opacity: 0.8
		} satisfies FlyParams as any,
		transitionIn = (transition ?? noop) as unknown as InTransition,
		transitionInParams,
		transitionOut = (transition ?? noop) as unknown as OutTransition,
		transitionOutParams,
		...rest
	}: DrawerProps & TransitionsProps<InOutTransition, InTransition, OutTransition> = $props();

	const { content } = dialog.elements;
</script>

<svelte:element
	this={as}
	{...rest}
	{...content}
	use:content
	class={twMerge(variants({ side }), className)}
	in:transitionIn={transitionInParams ?? transitionParams}
	out:transitionOut={transitionOutParams ?? transitionParams}
>
	{@render children?.()}
</svelte:element>
