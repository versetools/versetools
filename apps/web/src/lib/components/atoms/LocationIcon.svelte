<script lang="ts" module>
	export type LocationIconProps = {
		class?: string;
		type: GameLocationType | "Galaxy";
	} & Omit<HTMLImgAttributes, "src">;
</script>

<script lang="ts">
	import { GameLocationType } from "@versetools/types";
	import type { HTMLImgAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";

	import AstroidField from "$lib/assets/location-markers/AstroidField.png";
	import City from "$lib/assets/location-markers/City.png";
	import CommArray from "$lib/assets/location-markers/CommArray.png";
	import JumpPoint from "$lib/assets/location-markers/JumpPoint.png";
	import Marker from "$lib/assets/location-markers/Marker.png";
	import Moon from "$lib/assets/location-markers/Moon.png";
	import Outpost from "$lib/assets/location-markers/Outpost.png";
	import Planet from "$lib/assets/location-markers/Planet.png";
	import Station from "$lib/assets/location-markers/Station.png";
	import System from "$lib/assets/location-markers/System.png";

	let { class: className, type, ...rest }: LocationIconProps = $props();

	const src = $derived.by(() => {
		switch (type) {
			case GameLocationType.AsteroidField:
				return AstroidField;
			case GameLocationType.City:
				return City;
			case GameLocationType.CommArray:
				return CommArray;
			case GameLocationType.JumpPoint:
				return JumpPoint;
			case GameLocationType.Moon:
				return Moon;
			case GameLocationType.SecurityPost:
			case GameLocationType.Outpost:
				return Outpost;
			case GameLocationType.Planet:
				return Planet;
			case GameLocationType.Station:
				return Station;
			case GameLocationType.System:
				return System;
			default:
				return Marker;
		}
	});
</script>

<img {src} class={twMerge("size-6", className)} {...rest} />
