<script lang="ts" generics="T extends Thing">
	import { InlineScript } from "@versetools/ui";
	import type { Thing, WithContext } from "schema-dts";

	let { data }: { data: WithContext<T> } = $props();
</script>

<InlineScript type="application/ld+json" source={JSON.stringify(data)} />
