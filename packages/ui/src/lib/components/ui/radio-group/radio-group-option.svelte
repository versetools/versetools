<script lang="ts" module>
	export type RadioGroupOptionProps<T extends string> = {
		class?: string;
		group: RadioGroup;
		option: T;
	} & HTMLAttributes<HTMLDivElement>;
</script>

<script lang="ts" generics="T extends string">
	import type { RadioGroup } from "melt/builders";
	import type { HTMLAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	let { group, option, class: className, ...rest }: RadioGroupOptionProps<T> = $props();

	const item = group.getItem(option);
</script>

<div
	class={twMerge(
		"flex cursor-pointer items-center gap-3 outline-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
		className
	)}
	{...item.attrs}
	{...rest}
>
	<div
		class={twMerge(
			"border-input-border bg-input grid size-5 place-items-center rounded-full border-1",
			item.checked && "border-radio-active-border"
		)}
	>
		{#if item.checked}
			<div
				class={twMerge("size-3 rounded-full", item.checked && "bg-radio-active-dot")}
				aria-hidden="true"
			></div>
		{/if}
	</div>

	<span class="text-sm leading-none font-medium">
		{option}
	</span>
</div>
