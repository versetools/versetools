<script lang="ts" module>
	export type DialogDescriptionProps = CardDescriptionProps & {};
</script>

<script lang="ts">
	import { twMerge } from "tailwind-merge";

	import { Card, type CardDescriptionProps } from "../card";
	import { getDialogContext } from "./context";

	let { class: className, children, ...rest }: DialogDescriptionProps = $props();

	const { dialog } = getDialogContext();

	const { description } = dialog.elements;
</script>

<Card.Description {...rest} element={description} class={twMerge("text-sm font-normal", className)}>
	{@render children?.()}
</Card.Description>
