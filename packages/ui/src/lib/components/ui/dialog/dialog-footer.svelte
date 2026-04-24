<script lang="ts" module>
	export type DialogFooterProps = CardFooterProps & {};
</script>

<script lang="ts">
	import { Card, type CardFooterProps } from "../card";

	let { children, ...rest }: DialogFooterProps = $props();
</script>

<Card.Footer {...rest}>
	{@render children?.()}
</Card.Footer>
