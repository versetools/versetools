<script lang="ts" module>
	export type MarkdownProps = {
		value?: string | null;
		plugins?: Plugin[];
		excludeDefaultPlugins?: boolean;
	} & Omit<ComponentProps<typeof SvelteMarkdown>, "md" | "plugins">;

	const defaultPlugins: Plugin[] = [breaks(), spoilers(), strikethroughs()];
</script>

<script lang="ts">
	import type { ComponentProps } from "svelte";
	import type { Plugin } from "svelte-exmarkdown";
	import SvelteMarkdown from "svelte-exmarkdown";

	import { breaks, spoilers, strikethroughs } from "./plugins";
	import * as renderers from "./renderers.svelte";

	let { value, plugins = [], excludeDefaultPlugins = false, ...rest }: MarkdownProps = $props();
</script>

<SvelteMarkdown
	{...renderers}
	{...rest}
	md={value ?? ""}
	plugins={[...(excludeDefaultPlugins ? [] : defaultPlugins), ...plugins]}
/>
