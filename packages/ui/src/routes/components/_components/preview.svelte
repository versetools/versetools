<script lang="ts">
	import type { Snippet } from "svelte";

	import { Card } from "$lib";

	let { title, children }: { title: string; children: Snippet } = $props();
</script>

<div class="w-full max-w-2xl">
	<h1 class="my-8 text-4xl font-medium">{title}</h1>

	<Card size="full" class="p-6">
		<Card.Body class="min-h-64 justify-center">
			{@render children()}
		</Card.Body>
	</Card>
</div>
