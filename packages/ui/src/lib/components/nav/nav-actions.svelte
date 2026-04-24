<script lang="ts" module>
	export type NavActionsProps = {
		class?: string;
		children?: Snippet;
	} & HTMLAttributes<HTMLDivElement>;
</script>

<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	let { class: className, children, ...rest }: NavActionsProps = $props();
</script>

<div {...rest} class={twMerge("flex gap-6", className)}>
	{@render children?.()}
</div>
