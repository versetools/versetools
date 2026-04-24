<script lang="ts" module>
	export type SidebarFooterProps = {
		class?: string;
		children: Snippet;
	} & HTMLAttributes<HTMLElement>;
</script>

<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	let { class: className, children, ...rest }: SidebarFooterProps = $props();
</script>

<footer {...rest} class={twMerge("bg-sidebar relative", className)}>
	{@render children?.()}
</footer>
