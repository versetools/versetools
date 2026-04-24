<script lang="ts" module>
	const breakpoints = {
		window: {
			class: "lg:w-full",
			asideClass: "max-lg:pt-12",
			asideClosedClass: "max-lg:-translate-x-(--sidebar-width) max-lg:opacity-80",
			openClass: "lg:hidden",
			closeClass: "lg:hidden"
		},
		container: {
			class: "@4xl:w-full",
			asideClass: "@max-4xl:pt-12",
			asideClosedClass: "@max-4xl:-translate-x-(--sidebar-width) @max-4xl:opacity-80",
			openClass: "@4xl:hidden",
			closeClass: "@4xl:hidden"
		},
		"container-lg": {
			class: "@5xl:w-full",
			asideClass: "@max-5xl:pt-12",
			asideClosedClass: "@max-5xl:-translate-x-(--sidebar-width) @max-5xl:opacity-80",
			openClass: "@5xl:hidden",
			closeClass: "@5xl:hidden"
		},
		custom: {
			class: "",
			asideClass: "",
			asideClosedClass: "",
			openClass: "",
			closeClass: ""
		}
	} as const satisfies Record<
		string,
		{
			class: string;
			asideClass: string;
			asideClosedClass: string;
			openClass: string;
			closeClass: string;
		}
	>;

	export type SidebarProps = {
		class?: string;
		"inner-class"?: string;
		"open-class"?: string;
		OpenIcon?: Component;
		"close-class"?: string;
		CloseIcon?: Component;
		width?: number | string;
		breakpoint?: keyof typeof breakpoints;
		children: Snippet;
		openButton?: Snippet;
		closeButton?: Snippet;
	} & HTMLAttributes<HTMLElement>;
</script>

<script lang="ts">
	import MenuIcon from "@lucide/svelte/icons/menu";
	import XIcon from "@lucide/svelte/icons/x";
	import { useInteractOutside } from "@melt-ui/svelte/internal/actions";
	import { type Component, type Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import Button from "../ui/button.svelte";

	let {
		class: className,
		"inner-class": innerClass,
		"open-class": openClass,
		OpenIcon,
		"close-class": closeClass,
		CloseIcon,
		width = 260,
		breakpoint = "window",
		children,
		openButton,
		closeButton,
		...rest
	}: SidebarProps = $props();

	const widthMeasure = $derived(typeof width === "number" ? `${width}px` : width);

	let asideNode: HTMLElement;
	let open = $state(false);

	$effect(() => {
		if (!asideNode) return;

		const { destroy } = useInteractOutside(asideNode, {
			enabled: open,
			onInteractOutside() {
				open = false;
			}
		});

		return () => {
			destroy();
		};
	});
</script>

<div
	class={twMerge("max-w-(--sidebar-width) relative w-0", breakpoints[breakpoint].class, className)}
	style="--sidebar-width:{widthMeasure};"
>
	{#if !open}
		<Button
			Icon={OpenIcon ?? MenuIcon}
			variant="ghost"
			size="icon"
			corners="none"
			class={twMerge(
				"z-1 absolute left-full top-0 ml-4 mt-4",
				breakpoints[breakpoint].openClass,
				openClass
			)}
			onclick={() => (open = true)}
		>
			{@render openButton?.()}
		</Button>
	{/if}
	<aside
		{...rest}
		bind:this={asideNode}
		class={twMerge(
			"bg-sidebar border-sidebar-border w-(--sidebar-width) left-0 top-0 flex h-full max-h-screen flex-col border-r transition-transform",
			breakpoints[breakpoint].asideClass,
			breakpoint === "window" ? "z-41 fixed" : "sticky z-40",
			open ? "translate-x-0" : breakpoints[breakpoint].asideClosedClass,
			innerClass
		)}
	>
		<Button
			Icon={CloseIcon ?? XIcon}
			variant="ghost"
			size="icon"
			corners="none"
			class={twMerge("absolute left-4 top-4", breakpoints[breakpoint].closeClass, closeClass)}
			onclick={() => (open = false)}
		>
			{@render closeButton?.()}
		</Button>
		{@render children?.()}
	</aside>
</div>
