<script lang="ts">
	import { icons } from "../icons";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	const Icon = $derived(icons[data.icon as keyof typeof icons]);
</script>

<div class="flex size-full items-center justify-center">
	<Icon class="size-48" />
</div>
