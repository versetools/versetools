<script lang="ts" module>
	const variants = tv({
		base: "placeholder:text-input-placeholder relative flex w-full px-4 py-3 outline-hidden",
		variants: {
			size: {
				base: "text-sm font-medium placeholder:text-sm",
				lg: "text-base placeholder:text-base"
			}
		}
	});

	type Variant = VariantProps<typeof variants>;

	export type TextareaProps<T> = {
		class?: string;
		"textarea-class"?: string;
		value?: T;
		ref?: HTMLTextAreaElement | undefined;
	} & Variant &
		HTMLTextareaAttributes;
</script>

<script lang="ts" generics="T">
	import type { HTMLTextareaAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";
	import { tv, type VariantProps } from "tailwind-variants";

	import StyledRect from "./styled-rect.svelte";

	let {
		size = "base",
		class: className,
		"textarea-class": textareaClass,
		value = $bindable(),
		ref = $bindable(),
		...rest
	}: TextareaProps<T> = $props();

	let textareaEl: HTMLTextAreaElement | null = null;
	$effect(() => {
		ref = textareaEl ?? undefined;
	});

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		value;

		if (!textareaEl) return;
		if (textareaEl.scrollHeight > textareaEl.clientHeight) {
			textareaEl.style.height = `${textareaEl.scrollHeight}px`;
		}
	});
</script>

<div class={twMerge("relative", className)}>
	<StyledRect
		class="absolute top-0 left-0 h-full w-full"
		corners="none small"
		bg="--color-input"
		border="--color-input-border"
	/>
	<textarea
		{...rest}
		class={twMerge(variants({ size }), textareaClass)}
		bind:this={textareaEl}
		bind:value
	></textarea>
</div>
