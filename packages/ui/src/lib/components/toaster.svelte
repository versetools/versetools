<script lang="ts" module>
	export type ToasterProps = {
		class?: string;
	};

	const variants = tv({
		base: "group/toast text-text relative min-h-14 w-full p-px",
		variants: {
			variant: {
				default: "[--toast-bg:var(--color-toast)] [--toast-border:var(--color-toast-border)]",
				success:
					"[--toast-bg:var(--color-toast-success)] [--toast-border:var(--color-toast-success-border)]",
				destructive:
					"[--toast-bg:var(--color-toast-destructive)] [--toast-border:var(--color-toast-destructive-border)]"
			}
		}
	});

	type Variant = VariantProps<typeof variants>;

	type ToastData = {
		title: string;
		description?: string;
		customPercentage?: number | null;
		hideClose?: boolean;
	} & Variant;

	export type ToastConfig = {
		type?: "polite" | "assertive";
		delay?: number;
	} & ToastData;

	export type ProgressToastConfig = {} & ToastData;

	const toaster = new ToasterBuilder<Partial<ToastData>>({
		hover: "pause-all",
		tabHidden: "pause-all"
	});

	export function toast({ type, delay, ...data }: ToastConfig) {
		return toaster.addToast({ type, closeDelay: delay ?? 5000, data });
	}

	export function updateToast(id: string, { type, delay, ...data }: Partial<ToastConfig>) {
		toaster.updateToast({ id, type, closeDelay: delay, data });
	}

	export function progressToast({ ...data }: ProgressToastConfig) {
		const toast = toaster.addToast({
			type: "polite",
			closeDelay: 0,
			data: {
				customPercentage: 0,
				...data
			}
		});
		return {
			toast,
			setProgress(percentage: number) {
				toaster.updateToast({
					id: toast.id,
					data: {
						...toast.data,
						customPercentage: percentage
					}
				});
			},
			complete() {
				toast.removeSelf();
			}
		};
	}
</script>

<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import OctagonAlertIcon from "@lucide/svelte/icons/octagon-alert";
	import XIcon from "@lucide/svelte/icons/x";
	import { Toaster as ToasterBuilder } from "melt/builders";
	import { fly } from "svelte/transition";
	import { twMerge } from "tailwind-merge";
	import { tv, type VariantProps } from "tailwind-variants";

	import Button from "./ui/button.svelte";
	import Heading from "./ui/heading.svelte";
	import StyledRect from "./ui/styled-rect.svelte";

	let { class: className }: ToasterProps = $props();
</script>

<div
	{...toaster.root}
	class={twMerge(
		"fixed !bottom-4 !right-0 flex w-full max-w-sm flex-col items-end gap-1 overflow-x-hidden bg-transparent p-0 px-4",
		className
	)}
>
	{#each toaster.toasts as toast (toast.id)}
		<div
			{...toast.content}
			class={variants({ variant: toast.data.variant ?? "default" })}
			in:fly={{ x: 400, opacity: 0.8 }}
			out:fly={{ x: 400 }}
		>
			<StyledRect
				class="absolute left-0 top-0 h-full w-full"
				corners="none large"
				bg="--toast-bg"
				border="--toast-border"
				rounded="large"
			/>
			{#if toast.closeDelay > 0 || toast.data.customPercentage}
				<div
					class="relative h-[2px] w-full overflow-hidden"
					style="--width:{Math.min(
						100,
						Math.max(0, toast.data.customPercentage ?? toast.percentage)
					)}%"
				>
					<div class="w-(--width) bg-(--toast-border) h-[12px] rounded-t-sm"></div>
				</div>
			{/if}
			<div class="relative flex items-start p-1">
				<div class="flex flex-1 flex-col p-2">
					<Heading as="h3" size="base" {...toast.title} class="flex">
						{#if toast.data.variant === "success"}
							<CheckIcon class="text-text-success mr-1 mt-0.5 size-5 shrink-0" />
						{:else if toast.data.variant === "destructive"}
							<OctagonAlertIcon class="text-text-destructive mr-1 mt-0.5 size-5 shrink-0" />
						{/if}
						{toast.data.title}
					</Heading>
					{#if toast.data.description}
						<p {...toast.description} class="text-text-60 text-sm font-medium">
							{toast.data.description}
						</p>
					{/if}
				</div>
				{#if !toast.data.hideClose}
					<Button {...toast.close} variant="ghost" size="icon" corners="none">
						<XIcon class="size-4" />
					</Button>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	:global([popover]) {
		inset: unset;
	}
</style>
