<script lang="ts" module>
	export type PoweredByProps = {
		class?: string;
	} & Omit<HTMLAnchorAttributes, "href">;
</script>

<script lang="ts">
	import config from "@versetools/config";
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import { PUBLIC_SITE_URL } from "$env/static/public";

	import logo from "$lib/assets/logo.png";

	let { class: className, ...rest }: PoweredByProps = $props();
</script>

<a
	{...rest}
	href={PUBLIC_SITE_URL}
	class={twMerge("flex items-center gap-1 px-1.5 py-0.5 text-xs", className)}
>
	<span class="mt-0.25">Powered by</span>
	<img src={logo} width="112" height="20" alt="{config.name} logo" class="h-5 w-auto" />
</a>
