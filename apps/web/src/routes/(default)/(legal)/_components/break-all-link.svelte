<script lang="ts">
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	let {
		href,
		text = href.startsWith("mailto:") ? href.slice(7) : href,
		class: className,
		...rest
	}: { href: string; class?: string; text?: string } & Omit<
		HTMLAnchorAttributes,
		"children"
	> = $props();
</script>

<a
	{href}
	target={href?.startsWith("http") ? "_blank" : undefined}
	{...rest}
	class={twMerge("text-text-link break-all hover:underline", className)}
>
	{text}
</a>
