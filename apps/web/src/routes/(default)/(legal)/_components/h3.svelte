<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	let { children, ...rest }: { children: Snippet } & HTMLAttributes<HTMLHeadingElement> = $props();
</script>

<h3 class="text-text mb-1 mt-2 pt-4 text-lg font-medium" {...rest}>
	{@render children()}
</h3>
