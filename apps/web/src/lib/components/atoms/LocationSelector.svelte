<script lang="ts" module>
	export type LocationSelectorProps = {
		open?: boolean;
		value?: LocationWithChildren | null;
	};
</script>

<script lang="ts">
	import type { LocationWithChildren } from "$convex/app/commands/locations/LocationTreeQuery";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import SearchIcon from "@lucide/svelte/icons/search";
	import { Button, Card, Dialog, Input, Link, ScrollArea } from "@versetools/ui";
	import { twMerge } from "tailwind-merge";

	import { useLocations, type LocationWithParentsAndChildren } from "$lib/runes";

	import LocationIcon from "./LocationIcon.svelte";

	const locations = useLocations();

	let { open = $bindable(), value = $bindable() }: LocationSelectorProps = $props();

	let query = $state("");

	let pendingLocation = $state<LocationWithParentsAndChildren | null>(null);
	let selectedLocation = $derived(locations.all.find((l) => l._id === value?._id) ?? null);

	const breadcrumbs = $derived([
		{ name: "Systems", value: null },
		...(pendingLocation
			? [
					...(pendingLocation.parents ?? []),
					...(pendingLocation.children ? [pendingLocation] : [])
				].map((node) => ({
					name: node.name,
					value: node
				}))
			: [])
	]);

	const locationOptions = $derived(
		query ? locations.search(query) : locations.getChildren(pendingLocation)
	);
</script>

<Dialog.Portal bind:open>
	<Dialog.Overlay />
	<Dialog class="max-w-3xl">
		<Dialog.Header class="gap-4 px-0">
			<div class="flex gap-3 px-5 max-sm:flex-col sm:items-center">
				<Dialog.Title size="base">Location Selector</Dialog.Title>
				<Input placeholder="Search" size="sm" class="ml-auto w-full sm:max-w-sm" bind:value={query}>
					{#snippet icon()}
						<SearchIcon class="text-text-80 size-4" />
					{/snippet}
				</Input>
			</div>
			<ScrollArea
				direction="X"
				class="border-card-border w-full border-y"
				inner-class="flex items-center gap-2 px-5 py-2"
			>
				{#each breadcrumbs as breadcrumb, i (breadcrumb.value?._id ?? "root")}
					{@const isLast = i === breadcrumbs.length - 1}
					<Link
						class={twMerge(
							"text-sm font-medium",
							isLast && "text-text cursor-default hover:no-underline"
						)}
						onclick={isLast ? undefined : () => (pendingLocation = breadcrumb.value)}
					>
						{breadcrumb.name}
					</Link>
					{#if !isLast}
						<ChevronRightIcon class="text-text-60 size-4 shrink-0" />
					{/if}
				{/each}
			</ScrollArea>
			<Dialog.Close class="sm:hidden" />
		</Dialog.Header>
		<Dialog.Body class="bg-background-dark h-96 p-0">
			<ScrollArea direction="Y" inner-class="flex flex-col gap-2 px-5 py-4">
				{#each locationOptions as location (location._id)}
					<Card
						as="button"
						size="full"
						style={pendingLocation?._id === location._id
							? "--card-border: var(--color-light)"
							: undefined}
						onclick={() => {
							query = "";
							pendingLocation = location;
						}}
					>
						<Card.Body class="px-4 py-3">
							<div class="flex items-center gap-2">
								<LocationIcon type={location.type} />
								<Card.Title size="base">
									{location.name}
								</Card.Title>
							</div>
						</Card.Body>
					</Card>
				{/each}
			</ScrollArea>
		</Dialog.Body>
		<Dialog.Footer class="border-card-border flex-row flex-wrap items-center gap-4 border-t pt-4">
			{#if selectedLocation || pendingLocation}
				{@const location = (pendingLocation ?? selectedLocation)!}
				<div class="flex items-center gap-2">
					<LocationIcon type={location.type} />
					<span class="text-sm font-medium">{location!.name}</span>
				</div>
			{/if}
			<div class="ml-auto flex items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					onclick={() => {
						pendingLocation = null;
						open = false;
					}}
				>
					Cancel
				</Button>
				<Button
					variant="primary"
					size="sm"
					onclick={() => {
						value = pendingLocation ?? null;
						pendingLocation = null;
						open = false;
					}}
				>
					Select
				</Button>
			</div>
		</Dialog.Footer>
	</Dialog>
</Dialog.Portal>
