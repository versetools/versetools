<script lang="ts" module>
	type FooterItem = {
		name: string;
		Icon?: Component;
		class?: string;
	} & (
		| { href: string; isActive?: (url: URL) => boolean; onclick?: undefined }
		| { href?: undefined; isActive?: undefined; onclick?: (e: MouseEvent) => void }
	);

	const footerSections: {
		title: string;
		items: FooterItem[];
	}[] = [
		{
			title: "Product",
			items: [
				{ name: "Pricing", href: "/pricing" },
				{ name: "Demo", href: "/o/demo" },
				{ name: "Changelog", href: "/changelog" },
				{
					name: "Report a bug",
					href: `https://${config.parent.domain}/bug-report?service=${config.domain}`,
					Icon: BugIcon,
					class: "text-text-destructive/85 hover:text-text-destructive"
				}
			]
		},
		{
			title: "Resources",
			items: [
				{ name: "Support", href: "/support" },
				{ name: "FAQ", href: "/#faq" },
				{ name: "Blog", href: "/blog" },
				{ name: "Documentation", href: "/docs" }
			]
		},
		{
			title: "Socials",
			items: [
				{
					name: "Join our discord",
					href: config.socials.discord,
					Icon: DiscordIcon,
					class: "text-discord/85 hover:text-discord"
				},
				{ name: "Github", href: config.socials.github, Icon: GithubIcon },
				{ name: config.emails.contact, href: `mailto:${config.emails.contact}` }
			]
		}
	];

	const legalLinks: FooterItem[] = [
		{ name: "Terms of service", href: "/terms-of-service" },
		{ name: "Privacy Options", onclick: () => openConsentOptions() },
		{ name: "Privacy policy", href: config.parent.policies.privacy },
		{ name: "Cookie policy", href: "/cookie-policy" }
	];
</script>

<script lang="ts">
	import BugIcon from "@lucide/svelte/icons/bug";
	import { config } from "@versetools/core/config";
	import { smoothScrolling } from "@versetools/ui/helpers";
	import { DiscordIcon, GithubIcon } from "@versetools/ui/icons";
	import { openConsentOptions } from "@versetools/ui-consent";
	import type { Component } from "svelte";
	import { twMerge } from "tailwind-merge";

	import backgroundEmblem from "$lib/assets/emblem-large-dark.png";
	import logo from "$lib/assets/logo-dark.png";
	import madeByTheCommunity from "$lib/assets/made-by-the-community.png";
</script>

<footer
	class="z-1 invert-colors bg-background text-text relative flex w-full justify-center overflow-hidden"
>
	<img
		src={backgroundEmblem}
		alt="{config.name} emblem"
		class="size-128 max-xl:opacity-2 absolute bottom-1/2 max-xl:translate-y-1/2 xl:-bottom-2 xl:-right-2 xl:size-64"
	/>
	<div class="relative flex w-full max-w-6xl flex-col gap-16 px-16 py-16">
		<section class="flex h-fit w-full flex-col items-center gap-6 lg:items-start">
			<div
				class="flex flex-col flex-wrap items-center justify-center gap-x-12 gap-y-4 md:max-lg:flex-row lg:items-start"
			>
				<div class="flex flex-col items-end">
					<a href="/">
						<img
							src={logo}
							width="384"
							height="69"
							alt="{config.name} logo"
							class="h-auto w-[384px]"
						/>
					</a>
					<span class="text-text-80 text-xs">/ {config.parent.name}</span>
				</div>
				<span class="text-text-80 text-sm font-medium max-md:text-center">
					The ultimate org management tool for your Star Citizen organisation.
				</span>
			</div>
			<span class="relative text-xs font-medium"
				>Made with ❤️ by <a
					href="https://l3.dev"
					target="_blank"
					class="cursor-pointer hover:underline">l3.dev</a
				></span
			>
		</section>
		<div
			class="flex flex-1 flex-col flex-wrap justify-center gap-x-8 gap-y-8 max-sm:items-center sm:flex-row sm:justify-start sm:gap-x-16"
		>
			{#each footerSections as section (section.title)}
				<section class="w-full max-w-48">
					<h3 class="text-text-60 whitespace-nowrap text-xs font-semibold">{section.title}</h3>
					<ul class="flex flex-col gap-y-4 pt-4">
						{#each section.items as item (item.name)}
							{@const smoothScrollingProps = smoothScrolling(item.href)}
							<li>
								<svelte:element
									this={item.href ? "a" : "button"}
									href={item.href}
									target={item.href?.startsWith("http") ? "_blank" : undefined}
									{...smoothScrollingProps}
									onclick={item.onclick ?? smoothScrollingProps.onclick}
									class={twMerge(
										"text-text-80 hover:text-text flex items-center gap-1.5 text-sm font-medium transition-colors",
										"onclick" in item && "cursor-pointer",
										item.class
									)}
								>
									{#if item.Icon}
										<item.Icon class="size-4" />
									{/if}
									<span>{item.name}</span>
								</svelte:element>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
		<div class="flex w-full flex-col gap-8 max-lg:items-center">
			<section class="flex max-w-xl items-center gap-2">
				<img
					src={madeByTheCommunity}
					width="48"
					height="48"
					alt="Made by the community"
					class="size-12"
				/>
				<span class="text-text-80 text-xxs font-medium italic">
					This is an unofficial Star Citizen site, not affiliated with the Cloud Imperium group of
					companies. All content on this site not authored by its host or users are property of
					their respective owners.
				</span>
			</section>
			<section class="flex flex-wrap items-center gap-2">
				<span class="text-text-60 relative text-xs font-medium">
					© {new Date().getFullYear()}
					<a href="https://{config.parent.domain}" class="hover:underline">
						{config.parent.name}
					</a> All Rights Reserved
				</span>
				{#each legalLinks as item (item.name)}
					<div class="bg-text-40 size-1 rounded-full"></div>
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<svelte:element
						this={item.href ? "a" : "button"}
						href={item.href}
						target={item.href?.startsWith("http") ? "_blank" : undefined}
						onclick={item.onclick}
						class={twMerge(
							"text-text-60 hover:text-text flex items-center gap-1.5 text-xs font-medium transition-colors",
							"onclick" in item && "cursor-pointer",
							item.class
						)}
					>
						{#if item.Icon}
							<item.Icon class="size-4" />
						{/if}
						<span>{item.name}</span>
					</svelte:element>
				{/each}
			</section>
		</div>
	</div>
</footer>
