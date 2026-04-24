<script lang="ts" module>
	export type FormLabelProps = { class?: string } & FormSnap.LabelProps;
</script>

<script lang="ts">
	import * as FormSnap from "formsnap";
	import { twMerge } from "tailwind-merge";

	import Label from "../label.svelte";

	let { class: className, children, ...rest }: FormLabelProps = $props();
</script>

<FormSnap.Label>
	{#snippet child({ props })}
		<Label {...props} {...rest} class={twMerge("data-fs-error:text-text-destructive", className)}>
			{@render children?.()}
		</Label>
	{/snippet}
</FormSnap.Label>
