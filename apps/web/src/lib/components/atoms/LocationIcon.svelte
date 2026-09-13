<script lang="ts" module>
	export type LocationIconProps = {
		class?: string;
		type: LocationType | "Galaxy";
	} & Omit<HTMLImgAttributes, "src">;
</script>

<script lang="ts">
	import { LocationType } from "@versetools/types";
	import type { HTMLImgAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import AstroidField from "$lib/assets/location-markers/AstroidField.png";
	import Marker from "$lib/assets/location-markers/Marker.png";
	import Moon from "$lib/assets/location-markers/Moon.png";
	import Outpost from "$lib/assets/location-markers/Outpost.png";
	import Planet from "$lib/assets/location-markers/Planet.png";
	import Station from "$lib/assets/location-markers/Station.png";
	import System from "$lib/assets/location-markers/System.png";

	let { class: className, type, ...rest }: LocationIconProps = $props();

	const src = $derived.by(() => {
		switch (type) {
			case LocationType.Asteroid:
				return AstroidField;
			case LocationType.Moon:
				return Moon;
			case LocationType.Outpost:
				return Outpost;
			case LocationType.Planet:
				return Planet;
			case LocationType.System:
				return System;
			default:
				return Marker;
		}
	});
</script>

<img {src} class={twMerge("size-6", className)} {...rest} />
