<script lang="ts" module>
	export type SchemaProps<T extends Thing> = { data: WithContext<T> };
</script>

<script lang="ts" generics="T extends Thing">
	import { InlineScript } from "@versetools/ui";
	import type { Thing, WithContext } from "schema-dts";

	let { data }: SchemaProps<T> = $props();
</script>

<InlineScript type="application/ld+json" source={JSON.stringify(data)} />
