<script lang="ts" module>
	export type DrawerCloseProps = {
		inline?: boolean;
	} & ButtonProps;
</script>

<script lang="ts">
	import ArrowLeftFromLineIcon from "@lucide/svelte/icons/arrow-left-from-line";
	import ArrowRightFromLineIcon from "@lucide/svelte/icons/arrow-right-from-line";
	import { twMerge } from "tailwind-merge";

	import Button, { type ButtonProps } from "../button.svelte";
	import { getDrawerContext } from "./context";

	const { dialog, side } = getDrawerContext();

	let {
		class: className,
		inline = false,
		Icon = side === "left" ? ArrowLeftFromLineIcon : ArrowRightFromLineIcon,
		icon,
		iconProps,
		"icon-class": iconClass = "size-5",
		children,
		...rest
	}: DrawerCloseProps = $props();

	const { close } = dialog.elements;
</script>

<Button
	variant="ghost"
	size="icon"
	corners="none"
	{...rest}
	element={close}
	class={twMerge(
		!inline && twMerge("absolute top-2", side === "left" ? "right-4" : "left-4"),
		className
	)}
>
	{#if children}
		{@render children?.()}
	{:else if Icon}
		<Icon {...iconProps} class={iconClass} />
	{:else if icon}
		{@render icon(iconClass)}
	{/if}
</Button>
