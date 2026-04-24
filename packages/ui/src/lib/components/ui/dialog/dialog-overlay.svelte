<script lang="ts" module>
	export type DialogOverlayProps = {
		class?: string;
	} & HTMLAttributes<HTMLDivElement>;
</script>

<script
	lang="ts"
	generics="InOutTransition extends Transition<any>, InTransition extends Transition<any>, OutTransition extends Transition<any>"
>
	import type { HTMLAttributes } from "svelte/elements";
	import { fade } from "svelte/transition";
	import { twMerge } from "tailwind-merge";

	import { type Transition, type TransitionsProps } from "$lib/transitions";

	import { getDialogContext } from "./context";

	let {
		class: className,
		transition,
		transitionParams = { duration: 150 } as Parameters<InOutTransition>[1],
		transitionIn = (transition ?? fade) as InTransition,
		transitionInParams,
		transitionOut = (transition ?? fade) as OutTransition,
		transitionOutParams,
		...rest
	}: DialogOverlayProps & TransitionsProps<InOutTransition, InTransition, OutTransition> = $props();

	const { dialog } = getDialogContext();

	const { overlay } = dialog.elements;
</script>

<div
	{...rest}
	{...$overlay}
	use:overlay
	class={twMerge("bg-background/80 absolute inset-0 backdrop-blur-[1px]", className)}
	in:transitionIn={transitionInParams ?? transitionParams}
	out:transitionOut={transitionOutParams ?? transitionParams}
></div>
