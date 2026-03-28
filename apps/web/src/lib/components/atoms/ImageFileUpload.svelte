<script lang="ts" module>
	export type ImageFileUploadProps<TEndpoint extends keyof UploadsRouter> = {
		uploader: UseUploaderReturn<TEndpoint>;
		getInput: () => Parameters<UploadthingInterface<NoInfer<TEndpoint>>["startUpload"]>[1];
	} & Omit<ImageFileInputProps, "file" | "max-size" | "onFileChange">;
</script>

<script lang="ts" generics="TEndpoint extends keyof UploadsRouter">
	import type { UploadthingInterface, UseUploaderReturn } from "$lib/runes";
	import type { UploadsRouter } from "$server/uploads";

	import ImageFileInput, { type ImageFileInputProps } from "./ImageFileInput.svelte";

	let { uploader, getInput, disabled, ...rest }: ImageFileUploadProps<TEndpoint> = $props();
</script>

<ImageFileInput
	{...rest}
	max-size={uploader.imageConfig?.maxFileSize}
	width={uploader.imageConfig?.recommendedWidth ?? uploader.imageConfig?.maxWidth}
	height={uploader.imageConfig?.recommendedHeight ?? uploader.imageConfig?.maxHeight}
	disabled={disabled || uploader.isUploading}
	onFileChange={async (file) => {
		await uploader.startUpload([file], getInput() as any);
	}}
/>
