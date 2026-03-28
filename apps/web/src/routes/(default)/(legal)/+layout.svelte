<script lang="ts">
	import type { Snippet } from "svelte";

	import background from "$lib/assets/patterns/star-tile.png";

	let { children }: { children: Snippet } = $props();
</script>

<div class="bg-(image:--bg-image) flex-1 bg-repeat" style="--bg-image: url({background})">
	<div
		class="text-text-80 relative mx-auto flex max-w-3xl flex-1 flex-col px-8 pb-16 pt-8 text-sm md:pt-12"
	>
		{@render children()}
	</div>
</div>
