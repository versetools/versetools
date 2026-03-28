<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	let { children, ...rest }: { children: Snippet } & HTMLAttributes<HTMLUListElement> = $props();
</script>

<ul class="mb-6 ml-4 mt-2 list-outside list-disc" {...rest}>
	{@render children()}
</ul>
