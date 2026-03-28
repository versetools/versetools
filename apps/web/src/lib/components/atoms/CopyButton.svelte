<script lang="ts" module>
	export type CopyButtonProps = {
		class?: string;
		text: string;
	};
</script>

<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import { Button, toast } from "@versetools/ui";
	import { twMerge } from "tailwind-merge";

	let { class: className, text }: CopyButtonProps = $props();

	let copied = $state(false);
	let timeout: NodeJS.Timeout | null = null;
</script>

<Button
	variant="ghost"
	corners="none"
	size="xs"
	class={twMerge("px-1", className)}
	Icon={copied ? CheckIcon : CopyIcon}
	iconProps={{ strokeWidth: 2.5 }}
	icon-class={copied ? "text-text-success" : "text-text-link"}
	onclick={async () => {
		if (timeout) {
			clearTimeout(timeout);
		}

		await navigator.clipboard.writeText(text);
		copied = true;
		toast({
			variant: "success",
			title: "Successfully copied to clipboard"
		});

		timeout = setTimeout(() => {
			copied = false;
		}, 2000);
	}}
/>
