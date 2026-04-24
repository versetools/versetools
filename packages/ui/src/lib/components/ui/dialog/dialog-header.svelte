<script lang="ts" module>
	export type DialogHeaderProps = CardHeaderProps & {};
</script>

<script lang="ts">
	import { twMerge } from "tailwind-merge";

	import { Card, type CardHeaderProps } from "../card";

	let { class: className, children, ...rest }: DialogHeaderProps = $props();
</script>

<Card.Header {...rest} class={twMerge("relative", className)}>
	{@render children?.()}
</Card.Header>
