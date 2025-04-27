<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLTdAttributes } from "svelte/elements";

	let { children, ...rest }: { children: Snippet } & HTMLTdAttributes = $props();
</script>

<td class="max-w-sm p-2" {...rest}>
	{@render children?.()}
</td>
