<script lang="ts" module>
	export type CardTitleProps = HeadingProps & {};
</script>

<script lang="ts">
	import type { HeadingProps } from "../heading.svelte";
	import Heading from "../heading.svelte";

	let { as = "h3", size = "sm", children, ...rest }: CardTitleProps = $props();
</script>

<Heading {as} {size} {...rest}>
	{@render children?.()}
</Heading>
