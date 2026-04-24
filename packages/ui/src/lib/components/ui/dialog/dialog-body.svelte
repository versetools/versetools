<script lang="ts" module>
	export type DialogBodyProps = CardBodyProps & {};
</script>

<script lang="ts">
	import { Card, type CardBodyProps } from "../card";

	let { children, ...rest }: DialogBodyProps = $props();
</script>

<Card.Body {...rest}>
	{@render children?.()}
</Card.Body>
