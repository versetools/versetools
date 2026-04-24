<script lang="ts" module>
	export type FormFieldProps<T extends Record<string, unknown>, U extends FormPath<T>> = {
		class?: string;
	} & FormSnap.FieldProps<T, U>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>, U extends FormPath<T>">
	import * as FormSnap from "formsnap";
	import type { FormPath } from "sveltekit-superforms";
	import { twMerge } from "tailwind-merge";

	let {
		form,
		name,
		class: className,
		children: innerChildren,
		...rest
	}: FormFieldProps<T, U> = $props();
</script>

<FormSnap.Field {form} {name} {...rest}>
	{#snippet children(props)}
		<div class={twMerge("flex flex-col gap-1", className)}>
			{@render innerChildren?.(props)}
		</div>
	{/snippet}
</FormSnap.Field>
