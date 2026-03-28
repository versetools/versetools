<script lang="ts">
	import { smoothScrolling } from "@versetools/ui/helpers";
	import type { Snippet } from "svelte";
	import type { HTMLAnchorAttributes } from "svelte/elements";

	let { children, href, ...rest }: { children: Snippet } & HTMLAnchorAttributes = $props();

	const external = href?.startsWith("http");
	const smoothScrollingProps = !external ? smoothScrolling(href) : {};
</script>

<a
	{href}
	target={external ? "_blank" : undefined}
	class="text-text-link hover:underline"
	{...smoothScrollingProps}
	{...rest}
>
	{@render children()}
</a>
