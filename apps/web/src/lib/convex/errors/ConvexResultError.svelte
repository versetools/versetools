<script lang="ts" module>
	import type { Err } from "@l3dev/result";

	export type ConvexResultErrorProps = {
		class?: string;
		error: Error;
		components?: Record<string, Snippet<[Err<any, any>]>>;
	};
</script>

<script lang="ts">
	import {
		defaultMessages,
		isConvexResultError,
		isPermissionErr,
		resultErrorAsErr
	} from "@versetools/core/errors";
	import type { Snippet } from "svelte";
	import { twMerge } from "tailwind-merge";

	let { class: className, error, components }: ConvexResultErrorProps = $props();
</script>

{#if isConvexResultError(error)}
	{@const err = resultErrorAsErr(error)}
	{@const type = isPermissionErr(err) ? "MISSING_PERMISSION" : err.type}
	{@const component = components?.[type]}
	{#if component}
		{@render component(err)}
	{:else}
		{@const messageOrGetter = defaultMessages[type as keyof typeof defaultMessages] ?? null}
		{@const message = messageOrGetter
			? typeof messageOrGetter === "function"
				? messageOrGetter(err)
				: messageOrGetter
			: { title: "Error", description: String(err.type) }}
		<div class={twMerge("flex flex-col gap-1", className)}>
			<span class="text-text-destructive text-sm font-medium">
				{message.title}
			</span>
			<span class="text-text-destructive text-xs font-medium">
				{message.description}
			</span>
		</div>
	{/if}
{:else}
	<span class={twMerge("text-text-destructive text-sm font-medium", className)}>
		{error.message}
	</span>
{/if}
