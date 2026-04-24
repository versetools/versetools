<script lang="ts" module>
	const acceptTranslations = {
		"application/json": ".json",
		"application/javascript": ".js",
		"application/x-javascript": ".js",
		"application/typescript": ".ts",
		"application/x-typescript": ".ts",
		"text/javascript": ".js",
		"text/typescript": ".ts",
		"text/x-typescript": ".ts",
		"text/css": ".css",
		"text/html": ".html",
		"application/pdf": ".pdf",
		"application/msword": ".doc",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
		"application/vnd.ms-excel": ".xls",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
		"application/vnd.ms-powerpoint": ".ppt",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
		"text/plain": ".txt",
		"text/csv": ".csv",
		"image/jpeg": ".jpg",
		"image/png": ".png",
		"image/gif": ".gif",
		"image/svg+xml": ".svg"
	} satisfies Record<string, string>;

	export class EditableFile {
		public name = $state("");
		public readonly object: File;

		constructor(object: File) {
			this.name = object.name;
			this.object = object;

			const extension =
				object.name.split(".").length > 1 ? `.${object.name.split(".").at(-1)}` : "";
			$effect(() => {
				this.name =
					this.name.trim().replaceAll(/<br>/g, "").split(".").slice(0, -1).join(".") + extension;
			});
		}
	}

	export type FileInputProps = {
		accept: string[];
		value?: EditableFile[];
		"max-size"?: number;
		"max-files"?: number;
		multiple?: boolean;
		class?: string;
		"hide-dropzone"?: "never" | "when-full";
	} & Omit<HTMLInputAttributes, "value" | "accept">;
</script>

<script lang="ts">
	import PencilLineIcon from "@lucide/svelte/icons/pencil-line";
	import UploadIcon from "@lucide/svelte/icons/upload";
	import XIcon from "@lucide/svelte/icons/x";
	import { FileUpload } from "melt/builders";
	import type { HTMLInputAttributes } from "svelte/elements";
	import { SvelteSet } from "svelte/reactivity";
	import { twMerge } from "tailwind-merge";

	import StyledRect from "$lib/components/ui/styled-rect.svelte";

	let {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		id,
		accept,
		"max-size": maxSize,
		multiple,
		"max-files": maxFiles = multiple ? undefined : 1,
		class: className,
		value = $bindable([]),
		disabled,
		hidden,
		"hide-dropzone": hideDropzone = "never",
		...rest
	}: FileInputProps = $props();

	const fileUpload = new FileUpload({
		accept: accept.join(", "),
		maxSize,
		multiple,
		disabled: disabled ?? undefined,
		avoidDuplicates: true
	});

	const files = $derived.by(() => {
		let files: File[];
		if (fileUpload.selected instanceof SvelteSet) {
			files = Array.from(fileUpload.selected) as File[];
		} else {
			files = [fileUpload.selected].filter((file): file is File => !!file);
		}
		return files.map((file) => new EditableFile(file));
	});

	$effect(() => {
		value = files;
	});

	const showDropzone = $derived(
		!(hideDropzone === "when-full" && maxFiles && files.length >= maxFiles)
	);
</script>

<input {...fileUpload.input} {disabled} {...rest} />
<div class={twMerge("flex w-full max-w-md flex-col items-center", className)} {hidden}>
	{#if showDropzone}
		<div
			{...fileUpload.dropzone}
			class="relative flex aspect-video w-full flex-col items-center justify-center"
		>
			<StyledRect
				class="absolute left-0 top-0 h-full w-full"
				corners="small"
				bg="--color-input"
				border="--color-input-border"
			/>
			<div
				class="relative flex cursor-pointer flex-col items-center gap-2 self-stretch p-4 text-center"
			>
				{#if fileUpload.isDragging}
					<p class="text-text my-8 inline-flex flex-wrap text-sm font-medium">
						<UploadIcon class="mr-2 size-5" />
						Drop files here
					</p>
				{:else if !multiple && files.length && files[0] && files[0].object.type.startsWith("image/")}
					{@const file = files[0]}
					<img
						src={URL.createObjectURL(file.object)}
						alt={file.name}
						class="h-full w-full object-contain"
					/>
				{:else}
					<UploadIcon class="mt-8 size-10" />

					<p class="text-text-60 text-sm">
						<span class="text-text font-semibold">Click to upload</span>
						or drag and drop
					</p>
					<p class="text-text-60 mb-8 text-xs">
						{accept
							.map((type) => (acceptTranslations as Record<string, string>)[type] ?? type)
							.join(", ")}
						{#if maxSize}
							<span>(up to {maxSize.toBytesString()})</span>
						{/if}
						{#if multiple && maxFiles}
							<span>(max {maxFiles} files)</span>
						{/if}
					</p>
				{/if}
			</div>
		</div>
	{:else if files.length && files.some((file) => file.object.type.startsWith("image/"))}
		{@const imageFiles = files.filter((file) => file.object.type.startsWith("image/"))}
		<div
			class={twMerge(
				"grid gap-2",
				imageFiles.length > 1 && "grid-cols-2",
				imageFiles.length > 4 && "grid-cols-3"
			)}
		>
			{#each imageFiles as file (file)}
				<img
					src={URL.createObjectURL(file.object)}
					alt={file.name}
					class="h-full w-full object-contain"
				/>
			{/each}
		</div>
	{/if}

	{#if files.length}
		<ul class="mt-2 flex w-full flex-col gap-1">
			{#each files as file (file)}
				<li class="flex items-center gap-2">
					<div class="flex flex-1 flex-col">
						<div class="flex gap-1">
							<PencilLineIcon class="text-text-60 mt-0.5 size-4 shrink-0" strokeWidth="2.5" />
							<span
								contenteditable
								class="not-focus:line-clamp-1 break-all text-sm outline-none"
								bind:innerHTML={file.name}
							></span>
						</div>
						<span class="text-xxs text-text-60">{file.object.type}</span>
					</div>
					<span class="text-text-80 ml-auto shrink-0 text-xs"
						>{file.object.size.toBytesString()}</span
					>
					<button
						type="button"
						class="cursor-pointer opacity-60 hover:opacity-80"
						onclick={(e) => {
							e.preventDefault();
							fileUpload.remove(file.object);
						}}
					>
						<XIcon class="size-5" />
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
