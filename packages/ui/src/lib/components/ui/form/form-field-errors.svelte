<script lang="ts" module>
	export type FormFieldErrorsProps = {
		class?: string;
		"error-class"?: string;
	} & FormSnap.FieldErrorsProps;
</script>

<script lang="ts">
	import * as FormSnap from "formsnap";
	import { twMerge } from "tailwind-merge";

	let {
		class: className,
		"error-class": errorClass,
		children: customChildren,
		...rest
	}: FormFieldErrorsProps = $props();
</script>

<FormSnap.FieldErrors
	{...rest}
	class={twMerge("text-text-destructive text-xs font-medium", className)}
>
	{#snippet children({ errors, errorProps })}
		{#if customChildren}
			{@render customChildren({ errors, errorProps })}
		{:else}
			{#each errors as error (error)}
				<div {...errorProps} class={errorClass}>{error}</div>
			{/each}
		{/if}
	{/snippet}
</FormSnap.FieldErrors>
