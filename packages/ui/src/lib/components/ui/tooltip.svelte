<script lang="ts" module>
	const variants = tv({
		base: "relative px-2 py-1 text-sm font-medium",
		variants: {
			corners: cornersVariant
		},
		compoundVariants: [
			{
				corners: cornersConfigs.filter((c) => !c.includes("none")),
				class: "px-5"
			},
			{
				corners: cornersLeftConfigs,
				class: "pl-4"
			},
			{
				corners: cornersRightConfigs,
				class: "pr-4"
			}
		]
	});

	type Variant = VariantProps<typeof variants>;

	export type TooltipProps = {
		triggerId?: string;
		placement?: Placement;
		options?: MeltTooltipProps;
		class?: string;
		trigger: Snippet<[typeof TooltipBuilder.prototype.trigger]>;
		children: Snippet;
	} & Variant;
</script>

<script lang="ts">
	import type { Placement } from "@floating-ui/dom";
	import { Tooltip as TooltipBuilder, type TooltipProps as MeltTooltipProps } from "melt/builders";
	import type { Snippet } from "svelte";
	import { twMerge } from "tailwind-merge";
	import { tv, type VariantProps } from "tailwind-variants";

	import StyledRect, {
		cornersConfigs,
		cornersLeftConfigs,
		cornersRightConfigs,
		cornersVariant
	} from "./styled-rect.svelte";

	let {
		triggerId,
		placement = "top",
		options,
		corners = "none",
		class: className,
		trigger,
		children
	}: TooltipProps = $props();

	const tooltip = new TooltipBuilder({
		openDelay: 200,
		...options,
		floatingConfig:
			typeof options?.floatingConfig === "function"
				? options?.floatingConfig
				: {
						...options?.floatingConfig,
						offset: options?.floatingConfig?.offset ?? 8,
						computePosition: {
							placement,
							...options?.floatingConfig?.computePosition
						}
					}
	});

	if (triggerId) {
		tooltip.ids.trigger = triggerId;
	}
</script>

{@render trigger(tooltip.trigger)}
<div {...tooltip.content} class="text-tooltip-text relative bg-transparent font-normal">
	<div class="bg-tooltip-border">
		<div {...tooltip.arrow} class="size-2"></div>
	</div>
	<StyledRect
		class="absolute left-0 top-0 h-full w-full"
		{corners}
		bg="--color-tooltip"
		border="--color-tooltip-border"
		rounded="large"
	/>
	<div class={twMerge(variants({ corners }), className)}>
		{@render children()}
	</div>
</div>
