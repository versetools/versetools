<script lang="ts" module>
	export type RadioCardProps<T extends string> = CardProps & {
		group: RadioGroup;
		option: T;
	};
</script>

<script lang="ts" generics="T extends string">
	import type { RadioGroup } from "melt/builders";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import { setRadioCardContext } from "./context";
	import Card, { type CardProps } from "../card/card.svelte";

	let {
		as = "button",
		group,
		option,
		class: className,
		children,
		...rest
	}: RadioCardProps<T> = $props();

	const item = group.getItem(option);
	setRadioCardContext({
		get option() {
			return option;
		},
		get item() {
			return item;
		}
	});
</script>

<Card
	as={as as "button"}
	{...item.attrs}
	{...rest as HTMLButtonAttributes}
	class={twMerge(
		item.checked
			? "[--card-border:var(--color-radio-active-border)]"
			: "hover:[--card-border:var(--color-border-secondary)]",
		className
	)}
>
	{@render children?.()}
</Card>
