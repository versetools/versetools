<script lang="ts" module>
	export { h1, h2, h3, p, a, blockquote, ul, ol, hr };
</script>

<script lang="ts">
	import type { SvelteHTMLElements } from "svelte/elements";
	import { twMerge, type ClassNameValue } from "tailwind-merge";

	import Heading from "../ui/heading.svelte";
	import Link from "../ui/link.svelte";
</script>

{#snippet h1(props: SvelteHTMLElements["h1"])}
	<Heading as="h1" size="lg" {...props} class={props.class as string}>
		{@render props.children?.()}
	</Heading>
	<hr class="border-hr mb-4 mt-1.5" />
{/snippet}

{#snippet h2(props: SvelteHTMLElements["h2"])}
	<Heading as="h2" size="md" {...props} class={props.class as string}>
		{@render props.children?.()}
	</Heading>
{/snippet}

{#snippet h3(props: SvelteHTMLElements["h3"])}
	<Heading as="h3" size="sm" {...props} class={props.class as string}>
		{@render props.children?.()}
	</Heading>
{/snippet}

{#snippet hr(props: SvelteHTMLElements["hr"])}
	<hr {...props} class={twMerge("border-hr my-4", props.class as ClassNameValue)} />
{/snippet}

{#snippet p(props: SvelteHTMLElements["h3"])}
	<p {...props} class={twMerge("not-last:mb-[1rem]", props.class as string)}>
		{@render props.children?.()}
	</p>
{/snippet}

{#snippet a(props: SvelteHTMLElements["a"])}
	<Link {...props} href={props.href ?? "."} class={props.class as string}>
		{@render props.children?.()}
	</Link>
{/snippet}

{#snippet blockquote(props: SvelteHTMLElements["blockquote"])}
	<blockquote {...props} class={twMerge("relative my-2 pl-3", props.class as ClassNameValue)}>
		<div class="bg-border absolute left-0 top-0 h-full w-[4px] rounded-full"></div>
		{@render props.children?.()}
	</blockquote>
{/snippet}

{#snippet ul(props: SvelteHTMLElements["ul"])}
	<ul {...props} class={twMerge("pl-2.75 list-outside list-disc", props.class as ClassNameValue)}>
		{@render props.children?.()}
	</ul>
{/snippet}

{#snippet ol(props: SvelteHTMLElements["ol"])}
	<ol
		{...props}
		class={twMerge("pl-2.75 list-outside list-decimal", props.class as ClassNameValue)}
	>
		{@render props.children?.()}
	</ol>
{/snippet}
