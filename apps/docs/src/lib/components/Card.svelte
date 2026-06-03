<script lang="ts" module>
	import type { Snippet } from "svelte";

	export type CardProps = {
		title?: string;
		description?: string;
		corners?: CornersConfig;
		children?: Snippet;
	} & HTMLAnchorAttributes;
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from "svelte/elements";

	import StyledRect, { type CornersConfig } from "./StyledRect.svelte";

	let { corners = "none large", title, description, children, ...rest }: CardProps = $props();
</script>

<a {...rest} class="card">
	<StyledRect
		{corners}
		rounded="large"
		bg="var(--card-bg-hover,var(--card-bg))"
		border="var(--card-border-hover,var(--card-border))"
	/>
	<StyledRect {corners} rounded="large" bg="--card-bg" border="--card-border" />
	<div class="card-content">
		{#if title || description}
			<header class="card-header">
				<h3 class="card-title">{title}</h3>
				<p class="card-description">{description}</p>
			</header>
		{/if}
		{#if children}
			<div class="card-body">
				{@render children()}
			</div>
		{/if}
	</div>
</a>

<style>
	.card {
		--at-apply: "relative grid w-full cursor-pointer text-left";
		color: var(--svp-text);
	}

	.card:disabled,
	.card[data-disabled="true"] {
		--at-apply: "cursor-not-allowed opacity-50";
	}

	:global {
		.card .styled-rect {
			--at-apply: "absolute top-0 left-0 h-full w-full";
		}

		.styled-rect:nth-child(1) {
			--at-apply: "opacity-0";
		}

		.card:disabled > .styled-rect:nth-child(2),
		.card[data-disabled="true"] > .styled-rect:nth-child(2) {
			--at-apply: "opacity-50";
		}

		.card:hover > .styled-rect:nth-child(1) {
			--at-apply: "opacity-100";
		}

		.card:hover > .styled-rect:nth-child(2) {
			--at-apply: "opacity-0";
		}
	}

	.card-content {
		--at-apply: "relative flex w-full h-full flex-col p-px";
	}

	.card-header {
		--at-apply: "flex flex-col gap-0.25 px-5 pt-4";
	}

	.card-body {
		--at-apply: "flex flex-col gap-4 px-5 py-4";
	}

	.card-title {
		--at-apply: "font-semibold text-4.5";
		margin: 0;
	}

	.card-description {
		--at-apply: "text-sm font-medium";
		color: hsl(30, 3%, 80%);
	}
</style>
