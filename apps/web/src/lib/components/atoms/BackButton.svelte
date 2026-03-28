<script lang="ts" module>
	export type BackButtonProps = { class?: string } & HTMLButtonAttributes;
</script>

<script lang="ts">
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	let { class: className, children, ...rest }: BackButtonProps = $props();
</script>

<button
	{...rest}
	class={twMerge(
		"flex w-max cursor-pointer items-center gap-2 text-sm font-medium opacity-60 transition-opacity hover:opacity-80",
		className
	)}
>
	<ArrowLeftIcon class="size-5" />
	{@render children?.()}
</button>
