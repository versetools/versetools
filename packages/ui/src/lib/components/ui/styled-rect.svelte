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
		class?: string;
	};
</script>

<script lang="ts">
	import { twMerge } from "tailwind-merge";

	import StyledCorner from "./styled-corner.svelte";

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
		class: className
	}: StyledRectProps = $props();

	const topLeft = $derived(
		!corners?.includes(" ") ? corners : corners?.split(" ")[0]
	) as CornerSize;
	const bottomRight = $derived(
		!corners?.includes(" ") ? corners : corners?.split(" ")[1]
	) as CornerSize;
	const radius = $derived(rounded === "large" ? "var(--radius-md)" : "var(--radius-sm)");
</script>

<div
	aria-hidden="true"
	style="--rect-bg:{bg.startsWith('--') ? `var(${bg})` : bg};--rect-border:{border.startsWith('--')
		? `var(${border})`
		: border};"
	class={twMerge(
		"grid grid-rows-[1fr] border-(--rect-border) stroke-0",
		topLeft !== "none" || bottomRight !== "none" ? "grid-cols-2" : "grid-cols-1",
		className
	)}
>
	{#if topLeft !== "none"}
		<div
			class="grid border-inherit"
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
			<div class="border-t-1 border-inherit bg-(--rect-bg)"></div>
			<div
				class={twMerge(
					"col-span-2 border-b-1 border-l-1 border-inherit bg-(--rect-bg)",
					!isConnected(connect, ["left", "bottom"]) &&
						(rounded === "large" ? "rounded-bl-md" : "rounded-bl-sm")
				)}
			></div>
		</div>
	{/if}
	{#if topLeft === "none" || bottomRight === "none"}
		<div
			class={twMerge(
				"border-t-1 border-b-1 border-inherit bg-(--rect-bg)",
				!isConnected(connect, ["left", "top"]) &&
					topLeft === "none" &&
					(rounded === "large" ? "rounded-tl-md border-l-1" : "rounded-tl-sm border-l-1"),
				!isConnected(connect, ["left", "bottom"]) &&
					topLeft === "none" &&
					(rounded === "large" ? "rounded-bl-md border-l-1" : "rounded-bl-sm border-l-1"),
				!isConnected(connect, ["right", "top"]) &&
					bottomRight === "none" &&
					(rounded === "large" ? "rounded-tr-md border-r-1" : "rounded-tr-sm border-r-1"),
				!isConnected(connect, ["right", "bottom"]) &&
					bottomRight === "none" &&
					(rounded === "large" ? "rounded-br-md border-r-1" : "rounded-br-sm border-r-1")
			)}
		></div>
	{/if}
	{#if bottomRight !== "none"}
		<div
			class="grid border-inherit"
			style="grid-template-columns:minmax({radius},1fr) {pxCornerSize(
				bottomRight,
				inner
			)};grid-template-rows:minmax({radius},1fr) {pxCornerSize(bottomRight, inner)};"
		>
			<div
				class={twMerge(
					"col-span-2 border-t-1 border-r-1 border-inherit bg-(--rect-bg)",
					!isConnected(connect, ["right", "top"]) &&
						(rounded === "large" ? "rounded-tr-md" : "rounded-tr-sm")
				)}
			></div>
			<div class="border-b-1 border-inherit bg-(--rect-bg)"></div>
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
