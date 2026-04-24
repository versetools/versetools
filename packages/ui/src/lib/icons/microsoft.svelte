<script lang="ts">
	import Icon from "./icon.svelte";
	import type { IconProps } from "./icon.svelte";

	let props: Omit<IconProps, "svg"> = $props();
</script>

<Icon
	{...props}
	svg={`<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
<path d="M11.4062 11.4062H0V0H11.4062V11.4062Z" />
<path d="M24.0001 11.4062H12.594V0H24.0001V11.4062Z" />
<path d="M11.4059 24.0002H0V12.594H11.4059V24.0002Z" />
<path d="M24.0001 24.0002H12.594V12.594H24.0001V24.0002Z" />
</svg>`}
/>
