<script lang="ts" module>
	const variants = tv({
		base: "outline-hidden placeholder:text-input-placeholder relative flex w-full px-4 py-3 font-mono",
		variants: {
			size: {
				base: "text-sm placeholder:text-sm",
				lg: "text-base placeholder:text-base"
			}
		}
	});

	type Variant = VariantProps<typeof variants>;

	export type WysiwygInputProps = {
		class?: string;
		"textarea-class"?: string;
		value?: string | null;
		markdown?: Omit<MarkdownProps, "value">;
	} & Variant &
		HTMLTextareaAttributes;
</script>

<script lang="ts">
	import AtSignIcon from "@lucide/svelte/icons/at-sign";
	import BoldIcon from "@lucide/svelte/icons/bold";
	import CodeIcon from "@lucide/svelte/icons/code";
	import EyeIcon from "@lucide/svelte/icons/eye";
	import HeadingIcon from "@lucide/svelte/icons/heading";
	import ItalicIcon from "@lucide/svelte/icons/italic";
	import LinkIcon from "@lucide/svelte/icons/link";
	import ListIcon from "@lucide/svelte/icons/list";
	import ListOrderedIcon from "@lucide/svelte/icons/list-ordered";
	import StrikethroughIcon from "@lucide/svelte/icons/strikethrough";
	import TextQuoteIcon from "@lucide/svelte/icons/text-quote";
	import { Tabs } from "melt/builders";
	import type { HTMLTextareaAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";
	import { tv, type VariantProps } from "tailwind-variants";

	import Divider from "./wysiwyg-action-divider.svelte";
	import WysiwygAction from "./wysiwyg-action.svelte";
	import { Markdown, type MarkdownProps } from "../markdown";
	import StyledRect from "../ui/styled-rect.svelte";

	let {
		size = "base",
		class: className,
		"textarea-class": textareaClass,
		value = $bindable(),
		markdown,
		...rest
	}: WysiwygInputProps = $props();

	let textareaEl: HTMLTextAreaElement | null = null;
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		value;

		if (!textareaEl) return;
		if (textareaEl.scrollHeight > textareaEl.clientHeight) {
			textareaEl.style.height = `${textareaEl.scrollHeight}px`;
		}
	});

	type Selection = NonNullable<ReturnType<typeof getSelection>>;

	function getSelection() {
		if (!textareaEl) return null;
		value ??= "";

		const range = { start: textareaEl.selectionStart, end: textareaEl.selectionEnd };

		const selected = value.slice(range.start, range.end);
		const lines = value.split("\n");
		const lineIndex = value.slice(0, range.start).split("\n").length - 1;
		const line = lines[lineIndex] ?? "";
		return {
			range,
			selected,
			before: value.slice(0, range.start),
			after: value.slice(range.end),
			line,
			beforeLine: lineIndex > 0 ? lines.slice(0, lineIndex).join("\n") + "\n" : "",
			afterLine: value.length > range.end ? "\n" + lines.slice(lineIndex + 1).join("\n") : ""
		};
	}

	function updateSelected(
		action: (selection: Selection) => { selected?: string; before?: string; after?: string }
	) {
		if (!textareaEl) return;
		value ??= "";

		const selection = getSelection();
		if (!selection) return;

		const result = action({ ...selection });
		const selected = result.selected ?? selection.selected;
		const before = result.before ?? selection.before;
		const after = result.after ?? selection.after;

		value = before + selected + after;
		textareaEl.value = value;
		textareaEl.focus();
		textareaEl.setSelectionRange(before.length, before.length + selected.length);
	}

	function toggleWrapSelected(start: string, end?: string) {
		end ??= start;
		updateSelected((selection) => {
			if (selection.selected.startsWith(start) && selection.selected.endsWith(end)) {
				return {
					selected: selection.selected.slice(start.length, -end.length)
				};
			}
			if (selection.before.endsWith(start) && selection.after.startsWith(end)) {
				return {
					before: selection.before.slice(0, -start.length),
					after: selection.after.slice(end.length)
				};
			}
			return {
				before: `${selection.before}${start}`,
				after: `${end}${selection.after}`
			};
		});
	}

	function toggleQuote() {
		updateSelected((selection) => {
			if (selection.selected.startsWith("> ")) {
				return {
					selected: selection.selected.slice(2)
				};
			}
			if (selection.line.startsWith("> ")) {
				return {
					before: selection.beforeLine + (selection.before.split("\n").at(-1)?.slice(2) ?? "")
				};
			}
			return {
				before: selection.before
					? `${selection.before}${"\n".repeat(2 - (selection.before.match(/\n+$/)?.[0].length ?? 0))}> `
					: "> ",
				after: selection.after.trim()
					? `${selection.selected === "" ? "" : "\n".repeat(2 - (selection.after.match(/^\n+/)?.[0].length ?? 0))}${selection.after}`
					: ""
			};
		});
	}

	function toggleLink() {
		updateSelected((selection) => {
			const match = selection.selected.match(/^\[(?<text>.*)\]\((.*)\)$/);
			if (match) {
				return {
					selected: match.groups?.text
				};
			}
			return {
				selected: "url",
				before: `${selection.before}[${selection.selected}](`,
				after: `)${selection.after}`
			};
		});
	}

	function toggleList(prefix: string, prefixRegex?: RegExp) {
		prefixRegex ??= RegExp(`^${RegExp.escape(prefix)} `);

		updateSelected((selection) => {
			const match = selection.line.match(prefixRegex);
			if (match) {
				return {
					before:
						selection.beforeLine +
						(selection.before.split("\n").at(-1)?.slice(match[0].length).trimStart() ?? "")
				};
			}
			return {
				before: selection.beforeLine + `${prefix} ${selection.before.split("\n").at(-1) ?? ""}`
			};
		});
	}

	function cycleHeading() {
		const prefixRegex = RegExp(`^#+ `);

		updateSelected((selection) => {
			const match = selection.line.match(prefixRegex);
			if (match) {
				if (match[0].length >= 4) {
					return {
						before:
							selection.beforeLine +
							(selection.before.split("\n").at(-1)?.slice(match[0].length).trimStart() ?? "")
					};
				}
				return {
					before: selection.beforeLine + `#${selection.before.split("\n").at(-1) ?? ""}`
				};
			}
			return {
				before: selection.beforeLine + `# ${selection.before.split("\n").at(-1) ?? ""}`
			};
		});
	}

	function isList(line: string) {
		return line.match(/^(?<space>\s*)- /) || line.match(/^(?<space>\s*)\d+\. /);
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === "Enter") {
			const selection = getSelection();
			const ulMatch = selection?.line.match(/^(?<depth>\s*)- /);
			if (ulMatch) {
				updateSelected((selection) => {
					return {
						selected: "",
						before: `${selection.before}\n${ulMatch.groups?.depth ?? ""}- `
					};
				});
				e.preventDefault();
				return;
			}
			const olMatch = selection?.line.match(/^(?<depth>\s*)(?<number>\d+)\. /);
			if (olMatch) {
				let number = Number(olMatch.groups?.number ?? "1");
				if (isNaN(number)) {
					number = 1;
				}

				updateSelected((selection) => {
					return {
						selected: "",
						before: `${selection.before}\n${olMatch.groups?.depth ?? ""}${number + 1}. `
					};
				});
				e.preventDefault();
				return;
			}
		}

		if (e.key === "Tab") {
			const selection = getSelection();
			if (selection?.selected) {
				updateSelected((selection) => {
					const match = isList(selection.line);
					if (e.shiftKey && match) {
						const space = match.groups?.space ?? "";
						const line = space.slice(0, -2) + selection.line.slice(space.length);
						return {
							selected: line,
							before: selection.beforeLine,
							after: selection.afterLine
						};
					} else if (e.shiftKey) {
						return {
							selected: selection.line,
							before: selection.beforeLine,
							after: selection.afterLine
						};
					}
					return {
						selected: "  " + selection.line,
						before: selection.beforeLine,
						after: selection.afterLine
					};
				});
				e.preventDefault();
				return;
			}
		}
	}

	const modes = {
		write: "Write",
		preview: "Preview"
	} as const;

	type Mode = keyof typeof modes;

	const modeTabs = new Tabs<Mode>({
		value: "write"
	});
</script>

<div class={twMerge("@container/wysiwyg min-w-xs flex w-full flex-col", className)}>
	<div
		class="@xl/wysiwyg:flex-row-reverse @xl/wysiwyg:items-center bg-wysiwyg-toolbar border-wysiwyg-border border-1 flex flex-col flex-wrap justify-between rounded-t-md border-b-0"
	>
		<div class="@xl/wysiwyg:justify-end flex flex-wrap items-center px-1 py-0.5">
			<WysiwygAction
				title="Bold"
				Icon={BoldIcon}
				strokeWidth="3.5"
				onclick={() => toggleWrapSelected("**")}
			/>
			<WysiwygAction title="Italics" Icon={ItalicIcon} onclick={() => toggleWrapSelected("_")} />
			<WysiwygAction
				title="Strikethrough"
				Icon={StrikethroughIcon}
				onclick={() => toggleWrapSelected("~~")}
			/>
			<WysiwygAction title="Heading" Icon={HeadingIcon} onclick={() => cycleHeading()} />
			<div class="flex items-center">
				<Divider />
				<WysiwygAction title="Quote" Icon={TextQuoteIcon} onclick={() => toggleQuote()} />
				<WysiwygAction title="Code" Icon={CodeIcon} onclick={() => toggleWrapSelected("`")} />
				<WysiwygAction title="Link" Icon={LinkIcon} onclick={() => toggleLink()} />
				<WysiwygAction title="Spoiler" Icon={EyeIcon} onclick={() => toggleWrapSelected("||")} />
			</div>
			<div class="flex items-center">
				<Divider />
				<WysiwygAction
					title="Unordered list"
					Icon={ListIcon}
					onclick={() => {
						toggleList("-");
					}}
				/>
				<WysiwygAction
					title="Numbered list"
					Icon={ListOrderedIcon}
					onclick={() => {
						toggleList("1.", /\d+\. /);
					}}
				/>
			</div>
			<div class="flex items-center">
				<Divider />
				<WysiwygAction
					title="Mention"
					Icon={AtSignIcon}
					onclick={() => {
						updateSelected((selection) => ({
							before: `${selection.before}${/\S$/.test(selection.before) ? " " : ""}@`
						}));
					}}
				/>
			</div>
		</div>
		<div class="w-34 relative h-[38px] self-stretch">
			<div
				{...modeTabs.triggerList}
				class="z-1 absolute -left-px -top-px flex h-[calc(100%+2px)] items-end"
			>
				{#each Object.keys(modes) as Mode[] as mode (mode)}
					<button
						type="button"
						{...modeTabs.getTrigger(mode)}
						class="text-text-80 border-1 data-active:bg-wysiwyg-input data-active:text-text data-active:border-wysiwyg-border cursor-pointer self-stretch rounded-t-md border-b-0 border-transparent px-2 text-sm"
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
			bg="--color-wysiwyg-input"
			border="--color-wysiwyg-border"
		/>
		<textarea
			{...modeTabs.getContent("write")}
			{...rest}
			rows="8"
			class={twMerge(variants({ size }), textareaClass)}
			bind:this={textareaEl}
			bind:value
			{onkeydown}
		></textarea>
		<div {...modeTabs.getContent("preview")} class="min-h-46 relative px-4 py-3 text-sm">
			{#if !!value && !!value?.trim()}
				<Markdown {...markdown} {value} />
			{:else}
				<span>Nothing to preview</span>
			{/if}
		</div>
	</div>
</div>
