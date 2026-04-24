<script lang="ts" module>
	export type LabelProps = { class?: string } & HTMLLabelAttributes;
</script>

<script lang="ts">
	import type { HTMLLabelAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	let { class: className, children, ...rest }: LabelProps = $props();
</script>

<label {...rest} class={twMerge("text-sm font-medium", className)}>
	{@render children?.()}
</label>
