<script lang="ts">
	import type { Snippet } from "svelte";

	let { children }: { children: Snippet } = $props();
</script>

<div
	class="bg-background/70 text-text-80 relative mx-auto flex w-full max-w-3xl flex-col rounded-[6px] px-8 pt-4 text-sm backdrop-blur-2xl"
>
	{@render children()}
</div>
