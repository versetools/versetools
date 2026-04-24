<script lang="ts" module>
	export type InlineScriptProps = {
		source: string;
		type?: "importmap" | "module" | "speculationrules" | "application/ld+json" | (string & {});
		async?: boolean;
		blocking?: boolean;
		defer?: boolean;
		nomodule?: boolean;
		nonce?: string;
	};
</script>

<script lang="ts">
	import { attributesToString } from "$lib/helpers";

	let { source, type, async, blocking, defer, nomodule, nonce }: InlineScriptProps = $props();
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html `<script${attributesToString({ type, async, blocking, defer, nomodule, nonce })}>${source + "<"}/script>`}
