<script lang="ts" module>
	export type LinkProps = {
		class?: string;
	} & (
		| ({
				href: string;
				noscroll?: boolean;
				reload?: boolean;
				replacestate?: boolean;
		  } & HTMLAnchorAttributes)
		| ({
				href?: undefined;
				noscroll?: undefined;
				reload?: undefined;
				replacestate?: undefined;
		  } & HTMLButtonAttributes)
	);
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	let { href, class: className, children, ...rest }: LinkProps = $props();
</script>

{#if href}
	{@const { noscroll, reload, replacestate, ...props } = rest as {
		noscroll?: boolean;
		reload?: boolean;
		replacestate?: boolean;
	} & HTMLAnchorAttributes}
	<a
		{href}
		target={href.startsWith("http") ? "_blank" : undefined}
		data-sveltekit-noscroll={noscroll}
		data-sveltekit-reload={reload}
		data-sveltekit-replacestate={replacestate}
		{...props}
		class={twMerge("text-text-link hover:underline", className)}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		{...rest as HTMLButtonAttributes}
		type="button"
		class={twMerge("text-text-link inline cursor-pointer hover:underline", className)}
	>
		{@render children?.()}
	</button>
{/if}
