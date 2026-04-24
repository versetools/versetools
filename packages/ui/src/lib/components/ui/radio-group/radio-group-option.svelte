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
		"data-disabled:cursor-not-allowed data-disabled:opacity-50 flex cursor-pointer items-center gap-3 outline-none",
		className
	)}
	{...item.attrs}
	{...rest}
>
	<div
		class={twMerge(
			"border-1 border-input-border bg-input grid size-5 place-items-center rounded-full",
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

	<span class="text-sm font-medium leading-none">
		{option}
	</span>
</div>
