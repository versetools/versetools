<script lang="ts" module>
	export type NavProps = {
		class?: string;
		children?: Snippet;
	} & HTMLAttributes<HTMLElement>;
</script>

<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	let { class: className, children, ...rest }: NavProps = $props();
</script>

<nav {...rest} class={twMerge("flex items-center gap-12 p-2", className)}>
	{@render children?.()}
</nav>
