<script lang="ts" module>
	const navItems: (NavItem | NavItemGroup)[] = [
		{ name: "Pricing", href: "/pricing" },
		{ name: "Demo", href: "/o/demo" },
		{
			name: "Resources",
			floatingConfig: {
				computePosition: {
					placement: "bottom-start"
				},
				offset: {
					crossAxis: -16,
					mainAxis: 24
				}
			},
			items: [
				{ name: "FAQ", href: "/#faq" },
				{ name: "Blog", href: "/blog" },
				{ name: "Documentation", href: "/docs" },
				{ name: "Changelog", href: "/changelog" }
			]
		},
		{ name: "Support", href: "/support" }
	];
</script>

<script lang="ts">
	import config from "@versetools/config";
	import { Nav, type NavItem, type NavItemGroup } from "@versetools/ui";

	import logo from "$lib/assets/logo.png";
	import { posthog } from "$lib/states";

	const launchedFlag = posthog.useFeatureFlag("product-launched");

	function init(el: HTMLElement) {
		document.documentElement.style.setProperty("--header-height", `${el.offsetHeight}px`);

		const observer = new ResizeObserver(([entry]) => {
			if (!entry) return;
			document.documentElement.style.setProperty("--header-height", `${el.offsetHeight}px`);
		});
		observer.observe(el);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}
</script>

<header
	use:init
	class="sticky top-0 z-20 w-full mask-b-from-90% mask-b-to-transparent backdrop-blur-3xl"
>
	<div class="relative mx-auto flex h-full w-full max-w-6xl items-center py-5 pr-4 pl-6">
		<a href="/" class="mr-6 flex items-center gap-1">
			<img src={logo} width="200" height="36" alt="{config.name} Logo" class="h-[36px]" />
		</a>
		<div class="relative flex flex-1">
			<Nav class="w-full">
				<Nav.List items={navItems} more={false} class="mt-1 gap-x-6 text-sm max-md:hidden" />
				<Nav.Actions class="ml-auto flex gap-4"></Nav.Actions>
			</Nav>
		</div>
	</div>
</header>
