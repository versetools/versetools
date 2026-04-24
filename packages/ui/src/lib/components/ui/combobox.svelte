<script lang="ts" module>
	const variants = tv({
		base: "relative h-fit",
		variants: {
			variant: {
				default:
					"[--combobox-bg:var(--color-combobox)] [--combobox-border:var(--color-combobox-border)] [--combobox-popover-bg:var(--color-combobox-popover)] [--combobox-popover-border:var(--color-combobox-popover-border)] [--combobox-text:var(--color-combobox-text)]",
				destructive:
					"[--combobox-bg:var(--color-combobox-destructive)] [--combobox-border:var(--color-combobox-destructive-border)] [--combobox-popover-bg:var(--color-combobox-destructive-popover)] [--combobox-popover-border:var(--color-combobox-destructive-popover-border)] [--combobox-text:var(--color-combobox-destructive-text)]"
			},
			disabled: {
				true: ""
			},
			readonly: {
				true: ""
			}
		},
		compoundVariants: [
			{
				disabled: true,
				variant: "default",
				class:
					"[--combobox-bg:var(--color-combobox-disabled)] [--combobox-border:var(--color-combobox-border-disabled)] [--combobox-text:var(--color-combobox-text-disabled)]"
			},
			{
				readonly: true,
				variant: "default",
				class:
					"[--combobox-border:var(--color-combobox-border-disabled)] [--combobox-text:var(--color-combobox-text-disabled)]"
			},
			{
				disabled: true,
				variant: "destructive",
				class:
					"[--combobox-bg:var(--color-combobox-destructive-disabled)] [--combobox-border:var(--color-combobox-destructive-border-disabled)] [--combobox-text:var(--color-combobox-destructive-text-disabled)]"
			},
			{
				readonly: true,
				variant: "destructive",
				class:
					"[--combobox-border:var(--color-combobox-destructive-border-disabled)] [--combobox-text:var(--color-combobox-destructive-text-disabled)]"
			}
		]
	});

	type Variant = VariantProps<typeof variants>;

	const inputVariants = tv({
		base: "outline-hidden placeholder:text-combobox-placeholder text-(--combobox-text) w-full !bg-transparent py-3 pl-4",
		variants: {
			size: {
				sm: "py-2 text-sm font-medium placeholder:text-sm",
				base: "text-sm font-medium placeholder:text-sm",
				lg: "text-base placeholder:text-base"
			}
		}
	});

	type InputVariant = VariantProps<typeof inputVariants>;

	const itemVariants = tv({
		base: "group/combobox-item border-1 flex cursor-pointer items-center gap-1 rounded-sm px-1 text-sm hover:brightness-125",
		variants: {
			variant: {
				default: "bg-combobox-item border-combobox-item-border",
				destructive: "bg-combobox-destructive-item border-combobox-destructive-item-border"
			},
			size: {
				sm: "text-xs font-medium",
				base: "text-xs font-medium",
				lg: "text-sm font-medium"
			}
		}
	});

	const optionVariants = tv({
		base: "data-highlighted:bg-white/5 flex cursor-pointer items-center gap-2 bg-white/0 p-2 transition-colors hover:bg-white/5",
		variants: {
			size: {
				sm: "text-sm font-medium",
				base: "text-sm font-medium",
				lg: "text-base"
			}
		}
	});

	export type ComboboxOption<T> = {
		name: string;
		value: T;
		Icon?: Component;
		iconProps?: Record<string, any>;
		icon?: Snippet<[{ inItem: boolean; props?: Record<string, any> }]>;
	};

	export type ComboboxProps<
		T,
		TOption extends ComboboxOption<T> = ComboboxOption<T>,
		TMultiple extends boolean = false
	> = {
		class?: string;
		"input-class"?: string;
		"item-class"?: string;
		"option-class"?: string;
		value?: TMultiple extends true ? T[] : T | null | undefined;
		inputValue?: string;
		highlighted?: T | null;
		options: TOption[];
		multiple?: TMultiple;
		showAllOptions?: boolean;
		option?: Snippet<[{ option: TOption; icon: Snippet }]>;
		customInput?: Snippet<
			[
				{
					combobox: ComboboxBuilder<T, TMultiple>;
					value: T;
					props: Partial<ComboboxBuilder<T, TMultiple>["input"]> & {
						placeholder?: string | null;
						disabled?: boolean;
						readonly?: boolean;
						required?: boolean | null;
					};
				}
			]
		>;
	} & Variant &
		InputVariant &
		Omit<
			HTMLInputAttributes,
			"size" | Exclude<keyof ComboboxBuilder<T, TMultiple>["input"], "id" | "value">
		>;
</script>

<script lang="ts" generics="T, TOption extends ComboboxOption<T>, TMultiple extends boolean">
	import CheckIcon from "@lucide/svelte/icons/check";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import XIcon from "@lucide/svelte/icons/x";
	import { Combobox as ComboboxBuilder } from "melt/builders";
	import type { Component, Snippet } from "svelte";
	import type { HTMLInputAttributes } from "svelte/elements";
	import type { SvelteSet } from "svelte/reactivity";
	import { twMerge } from "tailwind-merge";
	import { tv, type VariantProps } from "tailwind-variants";

	import { keyboard } from "$lib/builders/utils/keyboard";
	import { Twill } from "$lib/patterns";

	import ScrollArea from "./scroll-area.svelte";
	import StyledRect from "./styled-rect.svelte";

	let {
		id,
		class: className,
		"input-class": inputClass,
		"item-class": itemClass,
		"option-class": optionClass,
		size = "base",
		variant = "default",
		value = $bindable(),
		inputValue,
		highlighted,
		multiple,
		showAllOptions,
		options,
		placeholder = "Select",
		disabled,
		readonly,
		required,
		customInput,
		option: optionSnippet,
		...rest
	}: ComboboxProps<T, TOption, TMultiple> = $props();

	let selected = $state<TMultiple extends true ? TOption[] : TOption | null | undefined>();

	const atleastOneSelected = $derived(multiple && selected && (selected as TOption[]).length);
	const showClearButton = $derived(!multiple && value && !disabled && !readonly && !required);

	function isMultiple(
		multiple: boolean | undefined,
		val: SvelteSet<T> | T | undefined
	): val is SvelteSet<T> {
		return !!multiple;
	}

	function clear() {
		combobox.value = undefined as TMultiple extends true ? SvelteSet<T> : T | undefined;
		combobox.inputValue = "";
	}

	function updateSelected(val: SvelteSet<T> | T | undefined) {
		if (isMultiple(multiple, val)) {
			const arr = val ? Array.from(val) : [];
			selected = arr
				.map((v) => options.find((opt) => opt.value === v))
				.filter((opt) => !!opt) as TMultiple extends true ? TOption[] : TOption | undefined;
		} else {
			selected = options.find((opt) => opt.value === val) as TMultiple extends true
				? TOption[]
				: TOption | undefined;
		}
	}

	const combobox = new ComboboxBuilder<T, TMultiple>({
		inputValue,
		highlighted,
		multiple,
		value,
		sameWidth: true,
		onValueChange(val) {
			value = val instanceof Set ? Array.from(val) : val;
			updateSelected(val);
		}
	});
	combobox.ids.input = id ?? combobox.ids.input;

	updateSelected(combobox.value);

	const filteredOptions = $derived.by(() => {
		if (showAllOptions) {
			return options;
		}

		let opts = options;
		if (combobox.touched) {
			opts = options.filter((opt) =>
				opt.name.toLowerCase().includes(combobox.inputValue.trim().toLowerCase())
			);
		}

		return opts.filter((opt) => !combobox.isSelected(opt.value));
	});

	function handleInputKeydown(e: KeyboardEvent) {
		if (e.key === keyboard.BACKSPACE || e.key === keyboard.DELETE) {
			if (multiple && !combobox.inputValue) {
				const lastSelected = Array.isArray(selected) && selected?.at(-1);
				if (lastSelected) {
					combobox.select(lastSelected.value);
					combobox.highlight(lastSelected.value);
					e.preventDefault();
					return;
				}
			} else if (!multiple && combobox.value) {
				clear();
				combobox.open = true;
			}
		}

		const allSelected = multiple && (selected as any[]).length >= options.length;
		if (allSelected && combobox.highlighted) {
			combobox.highlighted = null;
		}

		combobox.input.onkeydown(e);

		if ((!multiple || !allSelected) && e.key === keyboard.ENTER) {
			combobox.highlightNext();
		}
	}
</script>

<div class={twMerge(variants({ variant, disabled, readonly }), className)}>
	<StyledRect
		class="absolute left-0 top-0 h-full w-full"
		corners="none small"
		bg="--combobox-bg"
		border="--combobox-border"
	/>
	{#if disabled}
		<div class="absolute left-0 top-0 h-full w-full p-px">
			<Twill class="opacity-60" corners="none small" stroke="var(--combobox-border)" />
		</div>
	{/if}
	{#if atleastOneSelected}
		<div class="relative flex w-full flex-wrap gap-2 pl-4 pr-8 pt-3">
			{#each selected as TOption[] as option (option.value)}
				<button
					type="button"
					class={twMerge(itemVariants({ variant, size }), itemClass)}
					onclick={() => combobox.select(option.value)}
				>
					{#if option.Icon}
						<option.Icon {...option.iconProps} class={twMerge("size-3", option.iconProps?.class)} />
					{:else if option.icon}
						{@render option.icon({ inItem: true, props: option.iconProps })}
					{/if}
					<span>{option.name}</span>
					<XIcon class="size-3 opacity-60 outline-none group-hover/combobox-item:opacity-100" />
				</button>
			{/each}
		</div>
	{/if}
	{#if !multiple && !Array.isArray(selected) && selected && (selected.Icon || selected.icon)}
		<div class="absolute bottom-0 left-3 top-0 flex items-center">
			{#if selected.Icon}
				<selected.Icon
					{...selected.iconProps}
					class={twMerge("size-4", selected.iconProps?.class)}
				/>
			{:else if selected.icon}
				{@render selected.icon({ inItem: false, props: selected.iconProps })}
			{/if}
		</div>
	{/if}
	<div class="relative w-full">
		{#if customInput}
			{@render customInput({
				combobox,
				value,
				props: {
					...(disabled || readonly ? { id: combobox.input.id } : combobox.input),
					placeholder,
					disabled,
					readonly,
					required,
					value: (Array.isArray(selected) ? null : selected?.name) ?? combobox.input.value
				}
			})}
		{:else}
			<input
				{...disabled || readonly ? { id: combobox.input.id } : combobox.input}
				{...rest}
				{placeholder}
				{disabled}
				{readonly}
				{required}
				value={(Array.isArray(selected) ? null : selected?.name) ?? combobox.input.value}
				class={twMerge(
					inputVariants({ size }),
					atleastOneSelected && "pt-1",
					showClearButton ? "pr-13" : "pr-8",
					!multiple && !Array.isArray(selected) && selected && (selected.Icon || selected.icon)
						? "pl-9"
						: undefined,
					inputClass
				)}
				onkeydown={handleInputKeydown}
			/>
		{/if}
	</div>
	{#if showClearButton}
		<button
			type="button"
			class="absolute bottom-0 right-8 top-0 my-auto cursor-pointer opacity-60 outline-none transition-opacity hover:opacity-70"
			aria-label="Clear"
			onclick={clear}
		>
			<XIcon class="size-4" />
		</button>
	{/if}
	{#if disabled || readonly}
		<ChevronDownIcon
			class="absolute bottom-0 right-2 top-0 my-auto size-5 opacity-60 outline-none"
		/>
	{:else}
		<ChevronDownIcon
			{...combobox.trigger}
			class="absolute bottom-0 right-2 top-0 my-auto size-5 cursor-pointer outline-none transition-opacity hover:opacity-70"
		/>
	{/if}

	<div {...combobox.content} class="relative overflow-hidden rounded-sm bg-transparent">
		<StyledRect
			class="absolute left-0 top-0 h-full w-full"
			corners="none small"
			bg="--combobox-popover-bg"
			border="--combobox-popover-border"
		/>
		<ScrollArea
			id="{combobox.ids.content}-scroll-area"
			direction="Y"
			inner-class="text-text relative flex max-h-64 flex-col"
		>
			{#each filteredOptions as option (option.value)}
				{@const isSelected = combobox.isSelected(option.value)}
				<div
					{...combobox.getOption(option.value, option.name)}
					class={twMerge(optionVariants({ size }), optionClass)}
					onclick={() => {
						combobox.select(option.value);

						const inputEl = document.getElementById(combobox.input.id);
						if (inputEl && multiple && (selected as any[]).length < options.length) {
							inputEl.focus();
							requestAnimationFrame(() => {
								combobox.highlightNext();
								combobox.open = true;
							});
						}
					}}
				>
					{#snippet icon()}
						{#if option.Icon}
							<option.Icon
								{...option.iconProps}
								class={twMerge("size-4", option.iconProps?.class)}
							/>
						{:else if option.icon}
							{@render option.icon({ inItem: false, props: option.iconProps })}
						{/if}
					{/snippet}
					{#if optionSnippet}
						{@render optionSnippet({ option, icon })}
					{:else}
						{@render icon()}
						<span>{option.name}</span>
					{/if}
					{#if isSelected}
						<CheckIcon class="ml-auto size-5" />
					{/if}
				</div>
			{/each}
		</ScrollArea>
	</div>
</div>
