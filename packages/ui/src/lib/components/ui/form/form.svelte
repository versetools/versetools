<script lang="ts" module>
	export type FormProps = {
		form: SuperForm<any, any>;
		class?: string;
		children?: Snippet;
	} & HTMLFormAttributes;
</script>

<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLFormAttributes } from "svelte/elements";
	import type { SuperForm } from "sveltekit-superforms";
	import { twMerge } from "tailwind-merge";

	let { form, method = "post", class: className, children, ...rest }: FormProps = $props();

	const { enhance } = form;
</script>

<form
	method={!method ? undefined : method}
	enctype="multipart/form-data"
	novalidate
	{...rest}
	class={twMerge("flex flex-col gap-4", className)}
	use:enhance
>
	{@render children?.()}
</form>
