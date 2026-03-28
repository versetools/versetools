<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLTableAttributes } from "svelte/elements";

	let { children, ...rest }: { children: Snippet } & HTMLTableAttributes = $props();
</script>

<div class="my-4 w-full max-w-[calc(100vw-var(--spacing)*16)] overflow-x-auto">
	<table class="text-text w-full overflow-hidden rounded-[6px]" {...rest}>
		{@render children()}
	</table>
</div>
