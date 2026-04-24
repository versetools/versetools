<script lang="ts" module>
	export type SidebarHeaderProps = {
		class?: string;
		children: Snippet;
	} & HTMLAttributes<HTMLElement>;
</script>

<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	let { class: className, children, ...rest }: SidebarHeaderProps = $props();
</script>

<header {...rest} class={twMerge("flex flex-col px-5 py-6", className)}>
	{@render children?.()}
</header>
