<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	let { children, ...rest }: { children: Snippet } & HTMLAttributes<HTMLHeadingElement> = $props();
</script>

<h4 class="text-text mb-1 pt-4 font-medium" {...rest}>
	{@render children()}
</h4>
