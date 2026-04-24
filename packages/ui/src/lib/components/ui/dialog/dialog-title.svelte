<script lang="ts" module>
	export type DialogTitleProps = CardTitleProps & {};
</script>

<script lang="ts">
	import { Card, type CardTitleProps } from "../card";
	import { getDialogContext } from "./context";

	let { size = "xs", children, ...rest }: DialogTitleProps = $props();

	const { dialog } = getDialogContext();

	const { title } = dialog.elements;
</script>

<Card.Title {size} {...rest} element={title}>
	{@render children?.()}
</Card.Title>
