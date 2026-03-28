<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLOlAttributes } from "svelte/elements";

	let { children, ...rest }: { children: Snippet } & HTMLOlAttributes = $props();
</script>

<ol class="mb-6 ml-6 mt-2 list-outside list-decimal" {...rest}>
	{@render children()}
</ol>
