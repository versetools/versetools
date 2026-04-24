<script lang="ts">
	import type { Snippet } from "svelte";
	import { fade } from "svelte/transition";

	let { children, ...rest }: { children?: Snippet } = $props();

	let shown = $state(false);
</script>

<span {...rest} class="bg-spoiler-shown relative inline-block rounded px-1">
	{#if !shown}
		<button
			type="button"
			title="Show spoiler content"
			aria-label="Show spoiler content"
			class="bg-spoiler hover:bg-spoiler-hover absolute left-0 top-0 h-full w-full cursor-pointer rounded transition-colors"
			out:fade={{ duration: 100 }}
			onclick={() => (shown = true)}
		></button>
	{/if}
	<span aria-hidden={!shown}>
		{@render children?.()}
	</span>
</span>
