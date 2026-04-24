<script lang="ts" module>
	export type DialogProps = CardProps & {};
</script>

<script
	lang="ts"
	generics="InOutTransition extends Transition<any>, InTransition extends Transition<any>, OutTransition extends Transition<any>"
>
	import { flyAndScale, type Transition, type TransitionsProps } from "$lib/transitions";

	import { getDialogContext } from "./context";
	import { Card, type CardProps } from "../card";

	let {
		children,
		...rest
	}: DialogProps & TransitionsProps<InOutTransition, InTransition, OutTransition> = $props();

	const { dialog } = getDialogContext();

	const { content } = dialog.elements;
</script>

<Card
	transition={flyAndScale}
	transitionParams={{ y: 20, start: 0.9, duration: 150 }}
	{...rest}
	element={content}
>
	{@render children?.()}
</Card>
