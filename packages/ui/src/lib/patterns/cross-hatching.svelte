<script lang="ts" module>
	let globalId = 0;
</script>

<script lang="ts">
	import type { CornersConfig } from "$lib/components";

	import Mask from "./mask.svelte";

	let {
		id = `cross-hatching-pattern-${globalId++}`,
		corners,
		size = "base",
		class: className,
		stroke = "white"
	}: {
		id?: string;
		corners?: CornersConfig;
		size?: "base" | "small";
		class?: string;
		stroke?: string;
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
	<pattern id="{id}-cross-hatching" width="32" height="32" patternUnits="userSpaceOnUse">
		{#if size === "small"}
			<line x1="22.6464" y1="32.6464" x2="32.6464" y2="22.6464" {stroke} />
			<line x1="30.6464" y1="32.6464" x2="32.6464" y2="30.6464" {stroke} />
			<line x1="6.64645" y1="32.6464" x2="32.6464" y2="6.64645" {stroke} />
			<line x1="14.6464" y1="32.6464" x2="32.6464" y2="14.6464" {stroke} />
			<line x1="-0.353553" y1="7.64645" x2="7.64645" y2="-0.353553" {stroke} />
			<line x1="-0.353553" y1="15.6464" x2="15.6464" y2="-0.353553" {stroke} />
			<line x1="-0.353553" y1="31.6464" x2="31.6464" y2="-0.353552" {stroke} />
			<line x1="23.6464" y1="32.3536" x2="-0.353555" y2="8.35355" {stroke} />
			<line x1="31.6464" y1="32.3536" x2="-0.353552" y2="0.353554" {stroke} />
			<line x1="32.6464" y1="17.3536" x2="14.6464" y2="-0.646447" {stroke} />
			<line x1="15.6464" y1="32.3536" x2="-0.353553" y2="16.3536" {stroke} />
			<line x1="32.6464" y1="9.35355" x2="22.6464" y2="-0.646446" {stroke} />
			<line x1="32.6464" y1="1.35355" x2="30.6464" y2="-0.646447" {stroke} />
			<line x1="32.6464" y1="25.3536" x2="6.64645" y2="-0.646447" {stroke} />
			<line x1="7.64645" y1="32.3536" x2="-0.353553" y2="24.3536" {stroke} />
			<line x1="-0.353553" y1="23.6464" x2="23.6464" y2="-0.353555" {stroke} />
		{:else}
			<line x1="22.6464" y1="32.6464" x2="32.6464" y2="22.6464" {stroke} />
			<line x1="6.64645" y1="32.6464" x2="32.6464" y2="6.64645" {stroke} />
			<line x1="-0.353553" y1="7.64645" x2="7.64645" y2="-0.353553" {stroke} />
			<line x1="23.6464" y1="32.3536" x2="-0.353555" y2="8.35355" {stroke} />
			<line x1="32.6464" y1="9.35355" x2="22.6464" y2="-0.646446" {stroke} />
			<line x1="32.6464" y1="25.3536" x2="6.64645" y2="-0.646447" {stroke} />
			<line x1="7.64645" y1="32.3536" x2="-0.353553" y2="24.3536" {stroke} />
			<line x1="-0.353553" y1="23.6464" x2="23.6464" y2="-0.353555" {stroke} />
		{/if}
	</pattern>
	<Mask id="{id}-mask" {corners} />
	<rect fill="url(#{id}-cross-hatching)" mask="url(#{id}-mask)" width="100%" height="100%" />
</svg>
