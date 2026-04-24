<script lang="ts">
	import XIcon from "@lucide/svelte/icons/x";

	import { Button, type ButtonProps } from "$lib";

	import Preview from "../_components/preview.svelte";

	const variant: ButtonProps["variant"] = "primary";
</script>

<Preview title="Button">
	<Button {variant}>Button</Button>
	<Button {variant} size="lg">Button</Button>
	<Button {variant} size="sm">Button</Button>
	<Button {variant} size="xs">Button</Button>
	<Button {variant} size="icon" Icon={XIcon}></Button>
	<Button {variant} size="icon" Icon={XIcon} corners="none"></Button>
	<Button {variant} corners="none small">Button</Button>
	<Button {variant} corners="none small" size="lg">Button</Button>
	<Button {variant} corners="none small" size="sm">Button</Button>
	<Button {variant} corners="none small" size="xs">Button</Button>
	<Button {variant} corners="none small" size="icon" Icon={XIcon}></Button>
	<Button {variant} corners="small none">Button</Button>
	<Button {variant} corners="small none" size="lg">Button</Button>
	<Button {variant} corners="small none" size="sm">Button</Button>
	<Button {variant} corners="small none" size="xs">Button</Button>
	<Button {variant} corners="small none" size="icon" Icon={XIcon}></Button>
</Preview>
