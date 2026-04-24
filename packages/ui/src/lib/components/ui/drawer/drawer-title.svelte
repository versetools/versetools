<script lang="ts" module>
	export type DrawerTitleProps = HeadingProps & {};
</script>

<script lang="ts">
	import { getDrawerContext } from "./context";
	import type { HeadingProps } from "../heading.svelte";
	import Heading from "../heading.svelte";

	const { dialog } = getDrawerContext();

	let {
		as = "h3",
		size = "xs",
		element = dialog.elements.title,
		children,
		...rest
	}: DrawerTitleProps = $props();
</script>

<Heading {as} {size} {element} {...rest}>
	{@render children?.()}
</Heading>
