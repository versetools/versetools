<script lang="ts">
	import config from "@versetools/config";
	import { openConsentOptions } from "@versetools/ui-consent";

	import type { LayoutProps } from "./$types";

	import background from "$lib/assets/background.png";
	import logo from "$lib/assets/logo.png";
	import madeByTheCommunity from "$lib/assets/made-by-the-community.png";
	import gridTile from "$lib/assets/patterns/star-tile.png";

	let { children }: LayoutProps = $props();
</script>

<div class="relative flex w-full flex-1 flex-col">
	<img
		src={background}
		alt=""
		class="fixed top-0 left-0 h-full w-full object-cover opacity-75 blur-[2px]"
	/>
	<div
		class="relative flex w-full flex-1 flex-col bg-(image:--bg-grid-image) bg-[28px] bg-repeat bg-blend-overlay"
		style="--bg-grid-image: url({gridTile})"
	>
		<div class="flex w-full flex-1 flex-col items-center px-4 pt-16">
			<header>
				<a href="/" class="flex items-center gap-1 pr-4">
					<img src={logo} width="320" height="64" alt="{config.name} logo" class="h-16 w-auto" />
					<h1 class="sr-only">{config.name}</h1>
				</a>
			</header>
			<main class="flex w-full flex-1 flex-col items-center gap-4 pt-12">
				{@render children()}
			</main>
			<footer class="flex flex-col items-center py-16">
				<section class="mx-auto flex max-w-lg flex-col items-center gap-1">
					<img
						src={madeByTheCommunity}
						width="96"
						height="96"
						alt="Made by the community"
						class="size-24 opacity-80"
					/>
					<span class="text-text-80 text-center text-xs font-medium text-balance italic">
						This is an unofficial Star Citizen site, not affiliated with the Cloud Imperium group of
						companies. All content on this site not authored by its host or users are property of
						their respective owners.
					</span>
				</section>
				<section class="mt-4 flex flex-col items-center">
					<span class="text-text-60 relative text-xs font-medium">
						© {new Date().getFullYear()}
						<a href="/" class="hover:underline">{config.name}</a> All Rights Reserved.
					</span>
					<span class="relative text-xs"
						>Made with ❤️ by <a
							href="https://l3.dev"
							target="_blank"
							class="cursor-pointer hover:underline">l3.dev</a
						></span
					>
				</section>
				<section class="mt-4 flex justify-center gap-6 text-xs font-medium">
					<a href="/privacy-policy" class="text-text-60 hover:text-text-80 transition-colors">
						Privacy policy
					</a>
					<button
						class="text-text-60 hover:text-text-80 cursor-pointer transition-colors"
						onclick={() => openConsentOptions()}
					>
						Privacy Options
					</button>
				</section>
			</footer>
		</div>
	</div>
</div>
