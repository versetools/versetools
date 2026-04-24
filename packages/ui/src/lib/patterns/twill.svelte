<script lang="ts" module>
	let globalId = 0;
</script>

<script lang="ts">
	import type { CornersConfig } from "$lib/components";

	import Mask from "./mask.svelte";

	let {
		id = `twill-pattern-${globalId++}`,
		corners,
		size = "thin",
		class: className,
		stroke = "white",
		offsetX,
		offsetY
	}: {
		id?: string;
		corners?: CornersConfig;
		size?: "thin" | "thick";
		class?: string;
		stroke?: string;
		strokeWidth?: string;
		offsetX?: string | number;
		offsetY?: string | number;
	} = $props();
</script>

<svg
	{id}
	width="100%"
	height="100%"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	class={className}
>
	<pattern
		id="{id}-twill"
		x={offsetX}
		y={offsetY}
		width="32"
		height="32"
		patternUnits="userSpaceOnUse"
	>
		{#if size === "thick"}
			<line x1="-1.06066" y1="13.9393" x2="13.9393" y2="-1.06066" {stroke} stroke-width="3" />
			<line x1="-1.06066" y1="29.9393" x2="29.9393" y2="-1.06066" {stroke} stroke-width="3" />
			<line x1="10.9393" y1="33.9393" x2="33.9393" y2="10.9393" {stroke} stroke-width="3" />
			<line x1="26.9393" y1="33.9393" x2="33.9393" y2="26.9393" {stroke} stroke-width="3" />
		{:else}
			<line x1="-0.353553" y1="14.6464" x2="14.6464" y2="-0.353553" {stroke} />
			<line x1="-0.353553" y1="30.6464" x2="30.6464" y2="-0.353554" {stroke} />
			<line x1="13.6464" y1="32.6464" x2="32.6464" y2="13.6464" {stroke} />
			<line x1="29.6464" y1="32.6464" x2="32.6464" y2="29.6464" {stroke} />
		{/if}
	</pattern>
	<Mask id="{id}-mask" {corners} />
	<rect fill="url(#{id}-twill)" mask="url(#{id}-mask)" width="100%" height="100%" />
</svg>
