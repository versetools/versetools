<script lang="ts" module>
	const variants = tv({
		base: "bg-background-dark object-cover",
		variants: {
			size: {
				xs: "rounded-xs size-[24px] text-xs",
				sm: "rounded-xs size-[32px] text-xs",
				base: "rounded-xs size-[40px] text-base",
				lg: "size-[80px] rounded-md text-3xl",
				xl: "size-[160px] rounded-lg text-6xl"
			}
		}
	});

	type Variant = VariantProps<typeof variants>;

	export type AvatarProps = {
		avatarUrl?: string | null;
		fallbackInitial: string;
		class?: string;
	} & Variant;
</script>

<script lang="ts">
	import { twMerge } from "tailwind-merge";
	import { tv, type VariantProps } from "tailwind-variants";

	let { avatarUrl, fallbackInitial, size = "base", class: className }: AvatarProps = $props();

	let fallback = $state(false);
</script>

{#if avatarUrl && !fallback}
	<img
		src={avatarUrl}
		alt="Avatar"
		class={twMerge(variants({ size }), className, "text-sm")}
		onload={() => (fallback = false)}
		onerror={() => (fallback = true)}
	/>
{:else}
	<div class={twMerge("text-text flex items-center justify-center", variants({ size }), className)}>
		<span class="select-none">{fallbackInitial}</span>
	</div>
{/if}
