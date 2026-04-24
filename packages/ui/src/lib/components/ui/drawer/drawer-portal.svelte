<script lang="ts" module>
	const variants = tv({
		base: "fixed z-50 flex h-full w-full flex-col",
		variants: {
			size: {
				xs: "max-w-[260px]",
				sm: "max-w-xs",
				md: "max-w-md",
				lg: "max-w-lg",
				xl: "max-w-xl"
			},
			side: {
				left: "left-0 top-0",
				right: "right-0 top-0"
			} satisfies Record<DrawerSide, string>
		}
	});

	type Variant = VariantProps<typeof variants>;

	export type DrawerPortalProps = {
		class?: string;
	} & Variant &
		HTMLAttributes<HTMLDivElement> &
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
	import { tv, type VariantProps } from "tailwind-variants";

	import { setDrawerContext, type DrawerSide } from "./context";

	let {
		side = "right",
		size = "md",
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
	}: DrawerPortalProps = $props();

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

	setDrawerContext({
		get dialog() {
			return dialog;
		},
		get side() {
			return side;
		}
	});

	const { portalled } = dialog.elements;
</script>

{#if $open}
	<div {...rest} {...$portalled} use:portalled class={twMerge(variants({ side, size }), className)}>
		{@render children?.()}
	</div>
{/if}
