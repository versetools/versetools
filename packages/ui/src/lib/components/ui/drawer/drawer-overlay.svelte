<script lang="ts" module>
	export type DrawerOverlayProps = {
		class?: string;
	} & HTMLAttributes<HTMLDivElement>;
</script>

<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { fade } from "svelte/transition";
	import { twMerge } from "tailwind-merge";

	import { getDrawerContext } from "./context";

	let { class: className, ...rest }: DrawerOverlayProps = $props();

	const { dialog } = getDrawerContext();

	const { overlay } = dialog.elements;
</script>

<div
	{...rest}
	{...$overlay}
	use:overlay
	class={twMerge("bg-background/50 fixed inset-0 backdrop-blur-[1px]", className)}
	transition:fade={{ duration: 100 }}
></div>
