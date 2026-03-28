<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	let { children, ...rest }: { children: Snippet } & HTMLAttributes<HTMLHeadingElement> = $props();
</script>

<h2 class="text-text mb-4 mt-4 pt-4 text-2xl font-medium" {...rest}>
	{@render children()}
</h2>
