<script lang="ts" module>
	export type CardBodyProps = {
		class?: string;
		children?: Snippet;
		element?: AnyMeltElement;
	} & HTMLAttributes<HTMLDivElement>;
</script>

<script lang="ts">
	import { emptyMeltElement, type AnyMeltElement } from "@melt-ui/svelte";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	let {
		class: className,
		children,
		element = emptyMeltElement as AnyMeltElement,
		...rest
	}: CardBodyProps = $props();
</script>

<div {...rest} {...element} use:element class={twMerge("flex flex-col gap-4 px-5 py-4", className)}>
	{@render children?.()}
</div>
