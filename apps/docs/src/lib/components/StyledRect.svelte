<script lang="ts" module>
	export type CornerSize = "none" | "small" | "large";
	export type CornersConfig = CornerSize | Exclude<`${CornerSize} ${CornerSize}`, "none none">;

	const cornerSize = ["none", "small", "large"] satisfies CornerSize[];
	export const cornersConfigs = [
		...cornerSize,
		...cornerSize
			.flatMap((size) => cornerSize.map((brSize) => `${size} ${brSize}`))
			.filter((size) => size !== "none none")
	] as CornersConfig[];
	export const cornersRightConfigs = cornersConfigs.filter((c) => c.startsWith("none "));
	export const cornersLeftConfigs = cornersConfigs.filter((c) => c.endsWith(" none"));
	export const cornersVariant = cornersConfigs.reduce(
		(variant, config) => ({ ...variant, [config]: "" }),
		{} as Record<CornersConfig, string>
	);

	type Side = "top" | "bottom" | "left" | "right";

	export type StyledRectProps = {
		bg?: string;
		border?: string;
		corners?: CornersConfig | (string & {});
		inner?: boolean;
		rounded?: "small" | "large";
		connect?: Side;
		style?: string;
	};
</script>

<script lang="ts">
	import StyledCorner from "./StyledCorner.svelte";

	function isConnected(side: Side | undefined, includes: Side[]) {
		return side && includes.includes(side);
	}

	function getCornerSize(size: CornerSize, inner = false) {
		return size === "small" ? (inner ? "sm-inner" : "sm") : size === "large" ? "lg" : "lg-inner";
	}

	function pxCornerSize(size: CornerSize, inner = false) {
		return size === "small" ? (inner ? "16px" : "20px") : size === "large" ? "30px" : "26px";
	}

	let {
		bg = "white",
		border = "transparent",
		corners = "none",
		inner,
		rounded = "small",
		connect,
		style
	}: StyledRectProps = $props();

	const topLeft = $derived(
		!corners?.includes(" ") ? corners : corners?.split(" ")[0]
	) as CornerSize;
	const bottomRight = $derived(
		!corners?.includes(" ") ? corners : corners?.split(" ")[1]
	) as CornerSize;
	const radius = $derived(rounded === "large" ? "6px" : "3px");
</script>

<div
	aria-hidden="true"
	style="--rect-bg:{bg.startsWith('--') ? `var(${bg})` : bg};--rect-border:{border.startsWith('--')
		? `var(${border})`
		: border};--rect-radius:{radius};{style}"
	class="styled-rect"
	class:multi={topLeft !== "none" || bottomRight !== "none"}
>
	{#if topLeft !== "none"}
		<div
			class="rect-slice left"
			style="grid-template-columns:{pxCornerSize(
				topLeft,
				inner
			)} minmax({radius},1fr);grid-template-rows:{pxCornerSize(
				topLeft,
				inner
			)} minmax({radius},1fr);"
		>
			<StyledCorner
				corner="topLeft"
				size={getCornerSize(topLeft, inner)}
				roundness={rounded === "large" ? "md" : "sm"}
				bg="--rect-bg"
				border="--rect-border"
			/>
			<div class="slice-center"></div>
			<div
				class="slice-end"
				class:rect-slice-rounded-bl={!isConnected(connect, ["left", "bottom"])}
			></div>
		</div>
	{/if}
	{#if topLeft === "none" || bottomRight === "none"}
		<div
			class="rect-slice center"
			class:rect-slice-rounded-tl={!isConnected(connect, ["left", "top"]) && topLeft === "none"}
			class:rect-slice-rounded-bl={!isConnected(connect, ["left", "bottom"]) && topLeft === "none"}
			class:rect-slice-rounded-tr={!isConnected(connect, ["right", "top"]) &&
				bottomRight === "none"}
			class:rect-slice-rounded-br={!isConnected(connect, ["right", "bottom"]) &&
				bottomRight === "none"}
		></div>
	{/if}
	{#if bottomRight !== "none"}
		<div
			class="rect-slice right"
			style="grid-template-columns:minmax({radius},1fr) {pxCornerSize(
				bottomRight,
				inner
			)};grid-template-rows:minmax({radius},1fr) {pxCornerSize(bottomRight, inner)};"
		>
			<div
				class="slice-start"
				class:rect-slice-rounded-tr={!isConnected(connect, ["right", "top"])}
			></div>
			<div class="slice-center"></div>
			<StyledCorner
				corner="bottomRight"
				size={getCornerSize(bottomRight, inner)}
				roundness={rounded === "large" ? "md" : "sm"}
				bg="--rect-bg"
				border="--rect-border"
			/>
		</div>
	{/if}
</div>

<style>
	.styled-rect {
		--at-apply: "grid grid-rows-[1fr] grid-cols-1 stroke-0";
		border-color: var(--rect-border);
	}
	.styled-rect.multi {
		--at-apply: "grid-cols-2";
	}

	.rect-slice {
		--at-apply: "grid";
	}

	.rect-slice.center {
		--at-apply: "border-t-1 border-b-1 border-t-solid border-b-solid";
		border-color: var(--rect-border);
		background-color: var(--rect-bg);
	}

	.rect-slice .slice-start,
	.rect-slice .slice-center,
	.rect-slice .slice-end {
		border-color: var(--rect-border);
		background-color: var(--rect-bg);
	}
	.rect-slice.left .slice-center {
		--at-apply: "border-t-1 border-t-solid";
	}
	.rect-slice.right .slice-center {
		--at-apply: "border-b-1 border-b-solid";
	}

	.rect-slice .slice-start,
	.rect-slice .slice-end {
		--at-apply: "col-span-2";
	}
	.rect-slice.left .slice-end {
		--at-apply: "border-b-1 border-b-solid border-l-1 border-l-solid";
	}
	.rect-slice.right .slice-start {
		--at-apply: "border-t-1 border-t-solid border-r-1 border-r-solid";
	}

	.rect-slice-rounded-tl {
		border-top-left-radius: var(--rect-radius);
	}
	.rect-slice-rounded-tr {
		border-top-right-radius: var(--rect-radius);
	}
	.rect-slice-rounded-bl {
		border-bottom-left-radius: var(--rect-radius);
	}
	.rect-slice-rounded-br {
		border-bottom-right-radius: var(--rect-radius);
	}

	.rect-slice.center.rect-slice-rounded-tl,
	.rect-slice.center.rect-slice-rounded-bl {
		--at-apply: "border-l-1 border-l-solid";
	}

	.rect-slice.center.rect-slice-rounded-tr,
	.rect-slice.center.rect-slice-rounded-br {
		--at-apply: "border-r-1 border-r-solid";
	}
</style>
