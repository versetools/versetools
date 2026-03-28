<script lang="ts">
	import { Time } from "@internationalized/date";

	import { browser } from "$app/environment";

	const locale = browser ? navigator.language : "en";
	const timeFormatter = Intl.DateTimeFormat(locale, { hour: "numeric", hour12: true });
</script>

<div class="flex select-none flex-col">
	{#each Array.from( { length: 24 } ).flatMap( (_, h) => Array.from( { length: 2 } ).map((_, i) => new Time(h % 24, i * 30, 0)) ) as time, i (time)}
		<div class="relative h-8">
			{#if i % 2 === 0}
				<span
					class="text-text-40 absolute right-2 top-0 whitespace-nowrap text-xs font-medium uppercase"
				>
					{timeFormatter.format(new Date(0, 0, 0, time.hour))}
				</span>
			{:else if i === 24 * 2 - 1}
				<span
					class="text-text-40 absolute bottom-0 right-2 translate-y-1/2 whitespace-nowrap text-xs font-medium uppercase"
				>
					{timeFormatter.format(new Date(0, 0, 0, 24))}
				</span>
			{/if}
		</div>
	{/each}
</div>
