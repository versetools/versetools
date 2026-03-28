<script lang="ts" module>
	export type LocationInputProps = InputProps<Id<"gameLocations"> | null>;
</script>

<script lang="ts">
	import type { Id } from "$convex/_generated/dataModel";
	import { Button, Input, type InputProps } from "@versetools/ui";

	import { useLocations } from "$lib/runes";

	import LocationIcon from "./LocationIcon.svelte";
	import LocationSelector from "./LocationSelector.svelte";

	const locations = useLocations();

	let { value = $bindable(), ...rest }: LocationInputProps = $props();

	let selectorOpen = $state(false);
	let selectedLocation = $derived(locations.all.find((l) => l._id === value) ?? null);
</script>

{#snippet icon()}
	<LocationIcon class="size-5" type={selectedLocation?.type ?? "Galaxy"} />
{/snippet}

<Input
	{...rest}
	class="flex-1"
	input-class="text-input-text cursor-text"
	placeholder="No location selected"
	readonly
	icon={selectedLocation ? icon : undefined}
	value={selectedLocation?.name}
>
	{#snippet button()}
		<Button class="shrink-0" size="sm" corners="none small" onclick={() => (selectorOpen = true)}>
			Browse
		</Button>
	{/snippet}
</Input>

<LocationSelector
	bind:open={selectorOpen}
	bind:value={
		() => selectedLocation,
		(v) => {
			value = v?._id ?? null;
		}
	}
/>
