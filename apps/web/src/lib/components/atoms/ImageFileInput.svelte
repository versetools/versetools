<script lang="ts" module>
	const variants = tv({
		base: "group/image-file-upload bg-input border-input-border relative cursor-pointer self-start overflow-hidden rounded-[6px] border",
		variants: {
			size: {
				avatar: "size-32",
				emblem: "size-24",
				thumbnail: "aspect-video h-60 w-auto",
				custom: ""
			}
		}
	});

	type Variant = VariantProps<typeof variants>;

	export type ImageFileInputProps = {
		class?: string;
		imageClass?: string;
		src?: string | null;
		file?: File | null;
		alt: string;
		"max-size"?: number | FileSize;
		onFileChange?: (file: File, clearInput: () => void) => void | Promise<void>;
	} & Variant &
		Omit<HTMLInputAttributes, "value" | "accept" | "size">;
</script>

<script lang="ts">
	import ImageIcon from "@lucide/svelte/icons/image";
	import UploadIcon from "@lucide/svelte/icons/upload";
	import type { FileSize } from "@uploadthing/shared";
	import { FileUpload } from "melt/builders";
	import type { HTMLInputAttributes } from "svelte/elements";
	import { twMerge } from "tailwind-merge";
	import { tv, type VariantProps } from "tailwind-variants";

	const FILESIZE_UNITS = ["B", "KB", "MB", "GB", "TB"];
	function fileSizeToBytes(fileSize: FileSize) {
		const regex = new RegExp(`^(\\d+)(\\.\\d+)?\\s*(${FILESIZE_UNITS.join("|")})$`, "i");
		const match = fileSize.match(regex);
		if (!match?.[1] || !match[3]) return undefined;
		const sizeValue = parseFloat(match[1]);
		const sizeUnit = match[3].toUpperCase();
		const bytes = sizeValue * Math.pow(1024, FILESIZE_UNITS.indexOf(sizeUnit));
		return Math.floor(bytes);
	}

	let {
		id,
		class: className,
		imageClass,
		src,
		file = $bindable(),
		alt,
		"max-size": maxSize,
		size = "avatar",
		disabled,
		onFileChange,
		...rest
	}: ImageFileInputProps = $props();

	const fileUpload = new FileUpload({
		accept: "image/*",
		maxSize: maxSize
			? typeof maxSize === "number"
				? maxSize
				: fileSizeToBytes(maxSize)
			: undefined,
		multiple: false,
		disabled: disabled ?? undefined,
		onSelectedChange(selected) {
			const previousFile = file;
			file = selected;

			if (file && file !== previousFile) {
				onFileChange?.(file, () => {
					file = null;
				});
			}
		}
	});
	fileUpload.ids.input = id ?? fileUpload.ids.input;

	const previewSrc = $derived(file ? URL.createObjectURL(file) : src);
</script>

<input {...fileUpload.input} {disabled} {...rest} />
<div {...fileUpload.dropzone} class={twMerge(variants({ size }), className)}>
	{#if previewSrc}
		<img
			src={previewSrc}
			{alt}
			class={twMerge(
				"size-full",
				size === "avatar" ? "object-cover" : "object-contain",
				imageClass
			)}
		/>
	{:else}
		<div class="flex size-full items-center justify-center">
			<ImageIcon class="text-text-60 size-12" strokeWidth="1" />
		</div>
	{/if}
	<div
		class="bg-background/50 pointer-events-auto absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/image-file-upload:opacity-100"
	>
		<UploadIcon class="size-5" />
	</div>
</div>
