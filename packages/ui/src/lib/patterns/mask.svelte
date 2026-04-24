<script lang="ts">
	import type { CornerSize } from "$lib/components/ui/styled-rect.svelte";

	import type { CornersConfig } from "../components";

	let { id, corners }: { id: string; corners?: CornersConfig } = $props();

	const topLeft = $derived(
		!corners?.includes(" ") ? corners : corners?.split(" ")[0]
	) as CornerSize;
	const bottomRight = $derived(
		!corners?.includes(" ") ? corners : corners?.split(" ")[1]
	) as CornerSize;
</script>

<mask {id}>
	<rect x="0" y="0" width="100%" height="100%" fill="white" />
	{#if bottomRight === "small"}
		<g style:transform="translate(100%, 100%)">
			<rect x="-10" y="-10" width="20" height="20" style:transform="rotate(45deg)" fill="black" />
		</g>
	{:else if bottomRight === "large"}
		<g style:transform="translate(100%, 100%)">
			<rect x="-17" y="-17" width="40" height="40" style:transform="rotate(45deg)" fill="black" />
		</g>
	{/if}
	{#if topLeft === "small"}
		<rect x="-10" y="-10" width="20" height="20" style:transform="rotate(45deg)" fill="black" />
	{:else if topLeft === "large"}
		<rect x="-24" y="-24" width="40" height="40" style:transform="rotate(45deg)" fill="black" />
	{/if}
</mask>
