<script lang="ts" module>
	import type { LocationResponse } from "@versetools/types";
	import type { InputProps } from "@versetools/ui";

	export type LocationInputProps = InputProps<LocationResponse["_id"] | null>;
</script>

<script lang="ts">
	import { Button, Input } from "@versetools/ui";

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
