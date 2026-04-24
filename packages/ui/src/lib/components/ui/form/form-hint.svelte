<script lang="ts" module>
	export type FormHintProps = { class?: string } & FormSnap.DescriptionProps;
</script>

<script lang="ts">
	import * as FormSnap from "formsnap";
	import { twMerge } from "tailwind-merge";

	let { class: className, children, ...rest }: FormHintProps = $props();
</script>

<FormSnap.Description {...rest} class={twMerge("text-text-80 text-xs", className)}>
	{@render children?.()}
</FormSnap.Description>
