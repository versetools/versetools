<script lang="ts" module>
	export type FormFieldsetProps<
		T extends Record<string, unknown>,
		U extends FormPath<T>
	> = FormSnap.FieldsetProps<T, U>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>, U extends FormPath<T>">
	import * as FormSnap from "formsnap";
	import type { FormPath } from "sveltekit-superforms";

	let { form, name, ...rest }: FormFieldsetProps<T, U> = $props();
</script>

<FormSnap.Fieldset {form} {name} {...rest} />
