<script lang="ts" module>
	export type FormLegendProps = { class?: string } & FormSnap.LegendProps;
</script>

<script lang="ts">
	import * as FormSnap from "formsnap";
	import { twMerge } from "tailwind-merge";

	let { class: className, children, ...rest }: FormLegendProps = $props();
</script>

<FormSnap.Legend
	{...rest}
	class={twMerge("data-fs-error:text-text-destructive mb-1 leading-none", className)}
>
	{@render children?.()}
</FormSnap.Legend>
