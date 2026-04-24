<script lang="ts" module>
	export type FileSelectProps = FileInputProps & {
		class?: string;
		value?: EditableFile[];
		search?: string | null;
	};
</script>

<script lang="ts">
	import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
	import StretchHorizontalIcon from "@lucide/svelte/icons/stretch-horizontal";
	import { Tabs } from "melt/builders";
	import { twMerge } from "tailwind-merge";

	import Button from "./button.svelte";
	import FileInput, { EditableFile, type FileInputProps } from "./file-input.svelte";
	import Input from "./input.svelte";
	import StyledRect from "./styled-rect.svelte";

	let {
		class: className,
		value = $bindable([]),
		search = $bindable(),
		...rest
	}: FileSelectProps = $props();

	const modes = {
		upload: "Upload",
		search: "Search"
	} as const;

	type Mode = keyof typeof modes;

	const modeTabs = new Tabs<Mode>({
		value: "upload"
	});

	let searchLayout = $state<"grid" | "list">("grid");
</script>

<div class={twMerge("flex flex-col", className)}>
	<div
		class="bg-file-select-toolbar border-file-select-border border-1 flex flex-wrap items-center rounded-t-md border-b-0"
	>
		<div class="w-34 relative h-[38px] self-stretch">
			<div
				{...modeTabs.triggerList}
				class="z-1 absolute -left-px -top-px flex h-[calc(100%+2px)] items-end"
			>
				{#each Object.keys(modes) as Mode[] as mode (mode)}
					<button
						type="button"
						{...modeTabs.getTrigger(mode)}
						class="text-text-80 border-1 data-active:bg-file-select-input data-active:text-text data-active:border-file-select-border cursor-pointer self-stretch rounded-t-md border-b-0 border-transparent px-2 text-sm"
					>
						{modes[mode]}
					</button>
				{/each}
			</div>
		</div>
	</div>
	<div class="relative">
		<StyledRect
			class="absolute left-0 top-0 h-full w-full"
			corners="none small"
			rounded="large"
			connect="top"
			bg="--color-file-select-input"
			border="--color-file-select-border"
		/>
		<div class="relative flex justify-center p-3">
			<FileInput
				{...modeTabs.getContent("upload")}
				{...rest}
				class="max-w-none self-stretch"
				bind:value
			/>
			<div {...modeTabs.getContent("search")} class="flex w-full flex-col">
				<div class="flex gap-2">
					<Input placeholder="Search" class="flex-1" bind:value={search} />
					<div class="flex">
						<Button
							type="button"
							variant="ghost"
							corners="none"
							bg-class={searchLayout === "grid"
								? "opacity-10 group-hover/button:opacity-15"
								: undefined}
							onclick={(e: MouseEvent) => {
								e.preventDefault();
								searchLayout = "grid";
							}}
						>
							<LayoutGridIcon class="text-text-80 size-5" strokeWidth="2.5" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							corners="none"
							bg-class={searchLayout === "list"
								? "opacity-10 group-hover/button:opacity-15"
								: undefined}
							onclick={(e: MouseEvent) => {
								e.preventDefault();
								searchLayout = "list";
							}}
						>
							<StretchHorizontalIcon class="text-text-80 size-5" strokeWidth="2.5" />
						</Button>
					</div>
				</div>
				<div></div>
			</div>
		</div>
	</div>
</div>
