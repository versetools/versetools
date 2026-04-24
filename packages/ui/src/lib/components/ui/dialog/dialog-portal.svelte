<script lang="ts" module>
	export type DialogPortalProps = {
		class?: string;
	} & HTMLAttributes<HTMLDivElement> &
		Omit<CreateDialogProps, "ids" | "open"> &
		(
			| {
					dialog?: ReturnType<typeof createDialog>;
					open?: undefined;
					defaultOpen?: undefined;
			  }
			| {
					dialog?: undefined;
					open?: boolean;
					defaultOpen?: boolean;
			  }
		);
</script>

<script lang="ts">
	import { createDialog, type CreateDialogProps } from "@melt-ui/svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { writable } from "svelte/store";
	import { twMerge } from "tailwind-merge";

	import { setDialogContext } from "./context";

	let {
		class: className,
		dialog,
		role,
		portal,
		forceVisible,
		preventScroll = false,
		escapeBehavior = "ignore",
		open: openState = $bindable(),
		defaultOpen = false,
		onOpenChange,
		closeOnOutsideClick = true,
		onOutsideClick,
		openFocus,
		closeFocus,
		children,
		...rest
	}: DialogPortalProps = $props();

	const open = writable(openState ?? defaultOpen);

	$effect(() => {
		open.set(openState ?? false);
	});

	dialog ??= createDialog({
		role,
		portal,
		forceVisible,
		preventScroll,
		escapeBehavior,
		closeOnOutsideClick: closeOnOutsideClick,
		open,
		onOpenChange({ curr, next }) {
			openState = next;
			return onOpenChange?.({ curr, next }) ?? next;
		},
		onOutsideClick,
		openFocus,
		closeFocus
	});

	setDialogContext({
		get dialog() {
			return dialog;
		}
	});

	const { portalled } = dialog.elements;
</script>

{#if $open}
	<div
		{...rest}
		{...$portalled}
		use:portalled
		class={twMerge(
			"fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center px-4 pb-4",
			className
		)}
	>
		{@render children?.()}
	</div>
{/if}
