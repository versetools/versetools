<script lang="ts">
	import "../app.css";
	import CalendarDaysIcon from "@lucide/svelte/icons/calendar-days";
	import CalendarSearchIcon from "@lucide/svelte/icons/calendar-search";
	import CircleQuestionMarkIcon from "@lucide/svelte/icons/circle-question-mark";
	import ClockIcon from "@lucide/svelte/icons/clock";
	import ClockPlusIcon from "@lucide/svelte/icons/clock-plus";
	import CommandIcon from "@lucide/svelte/icons/command";
	import Heading1Icon from "@lucide/svelte/icons/heading-1";
	import LinkIcon from "@lucide/svelte/icons/link";
	import ListCollapseIcon from "@lucide/svelte/icons/list-collapse";
	import MegaphoneIcon from "@lucide/svelte/icons/megaphone";
	import MessageSquareIcon from "@lucide/svelte/icons/message-square";
	import MessageSquareWarningIcon from "@lucide/svelte/icons/message-square-warning";
	import PackageSearchIcon from "@lucide/svelte/icons/package-search";
	import PanelRightOpenIcon from "@lucide/svelte/icons/panel-right-open";
	import ScanTextIcon from "@lucide/svelte/icons/scan-text";
	import SquareCheckIcon from "@lucide/svelte/icons/square-check";
	import SquareStackIcon from "@lucide/svelte/icons/square-stack";
	import StickyNoteIcon from "@lucide/svelte/icons/sticky-note";
	import TextCursorInputIcon from "@lucide/svelte/icons/text-cursor-input";
	import TextInitialIcon from "@lucide/svelte/icons/text-initial";
	import TimerIcon from "@lucide/svelte/icons/timer";
	import ToggleRightIcon from "@lucide/svelte/icons/toggle-right";
	import TypeOutlineIcon from "@lucide/svelte/icons/type-outline";

	import { ScrollArea, Sidebar, type SidebarItem, type SidebarSection } from "$lib";

	import type { LayoutProps } from "./$types";
	import { icons } from "./icons/icons";

	let { children }: LayoutProps = $props();

	const components = [
		{ name: "Accordion", Icon: ListCollapseIcon },
		{ name: "Button", Icon: CommandIcon },
		{ name: "Card", Icon: StickyNoteIcon },
		{ name: "Checkbox", Icon: SquareCheckIcon },
		{ name: "Combobox", Icon: PackageSearchIcon },
		{ name: "Confirmation Dialog", Icon: MessageSquareWarningIcon },
		{ name: "Date Calendar", Icon: CalendarDaysIcon },
		{ name: "Date Picker", Icon: CalendarSearchIcon },
		{ name: "Dialog", Icon: MessageSquareIcon },
		{ name: "Drawer", Icon: PanelRightOpenIcon },
		{ name: "Duration Input", Icon: TimerIcon },
		{ name: "Duration Select", Icon: TimerIcon },
		{ name: "Heading", Icon: Heading1Icon },
		{ name: "Input", Icon: TextCursorInputIcon },
		{ name: "Link", Icon: LinkIcon },
		{ name: "Markdown", Icon: TextInitialIcon },
		{ name: "Segmented Button", Icon: SquareStackIcon },
		{ name: "Switch", Icon: ToggleRightIcon },
		{ name: "Textarea", Icon: ScanTextIcon },
		{ name: "Time Input", Icon: ClockIcon },
		{ name: "Time Select", Icon: ClockPlusIcon },
		{ name: "Toaster", Icon: MegaphoneIcon },
		{ name: "Tooltip", Icon: CircleQuestionMarkIcon },
		{ name: "Wysiwyg Input", Icon: TypeOutlineIcon }
	];

	const navItems: (SidebarItem | SidebarSection)[] = [
		{
			title: "Components"
		},
		...components.map((component) => ({
			...component,
			href: `/components/${component.name.toLowerCase().replaceAll(" ", "-")}`
		})),
		{
			title: "Icons"
		},
		...Object.keys(icons).map((icon) => ({
			name: icon,
			href: `/icons/${icon}`
		}))
	];
</script>

<svelte:head>
	<title>VerseTools UI</title>
</svelte:head>

<div class="@container flex min-h-screen w-full">
	<Sidebar>
		<Sidebar.Header>
			<div class="flex items-center justify-between gap-2">
				<span class="text-lg font-medium">VerseTools UI</span>
				<img src="/favicon.png" alt="VerseTools UI" class="size-8" />
			</div>
		</Sidebar.Header>
		<ScrollArea id="sidebar-scroll-area" direction="Y">
			<Sidebar.Nav items={navItems} />
		</ScrollArea>
	</Sidebar>
	<main class="text-text bg-background-dark flex flex-1 flex-col items-start gap-4 p-8">
		{@render children()}
	</main>
</div>
