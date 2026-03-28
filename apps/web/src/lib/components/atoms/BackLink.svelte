<script lang="ts" module>
	export type BackLinkProps = { class?: string } & HTMLAnchorAttributes;
</script>

<script lang="ts">
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	let { class: className, children, ...rest }: BackLinkProps = $props();
</script>

<a
	{...rest}
	class={twMerge(
		"flex w-max cursor-pointer items-center gap-2 text-sm font-medium opacity-60 transition-opacity hover:opacity-80",
		className
	)}
>
	<ArrowLeftIcon class="size-5" />
	{@render children?.()}
</a>
