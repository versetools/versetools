import { UploadAbortedError, type UploadThingError } from "@uploadthing/shared";
import { generateSvelteHelpers, type UseUploadthingProps } from "@uploadthing/svelte";
import { useConvex } from "@versetools/convex-client/svelte";
import { progressToast, updateToast, type ToastConfig } from "@versetools/ui";
import { fromStore } from "svelte/store";
import type {
	ClientUploadedFileData,
	ExpandedRouteConfig,
	inferEndpointOutput,
	inferErrorShape
} from "uploadthing/types";

import { PUBLIC_SITE_URL } from "$env/static/public";
import type { UploadsRouter } from "$server/uploads";

import { AnimationFrames } from "$lib/helpers/animation-frames.svelte";

const { createUploadThing } = generateSvelteHelpers<UploadsRouter>({
	url: new URL("/api/upload", PUBLIC_SITE_URL).toString()
});

export type UploadthingInterface<TEndpoint extends keyof UploadsRouter> = ReturnType<
	typeof createUploadThing<TEndpoint>
>;

type UploadListeners<TEndpoint extends keyof UploadsRouter> = {
	onBegin?: (fileName: string) => void;
	onProgress?: (progress: number) => void;
	onError?: (err: UploadThingError<inferErrorShape<UploadsRouter[TEndpoint]>>) => void;
	onAbort?: () => void;
	onComplete?: (
		metadata: ClientUploadedFileData<inferEndpointOutput<UploadsRouter[TEndpoint]>>[]
	) => void;
};

export type UseUploaderOptions<TEndpoint extends keyof UploadsRouter> = Pick<
	UseUploadthingProps<UploadsRouter[TEndpoint]>,
	| "headers"
	| "uploadProgressGranularity"
	| "onBeforeUploadBegin"
	| "onUploadBegin"
	| "onUploadError"
	| "onUploadProgress"
	| "onClientUploadComplete"
> & {
	onUpload?: (files: File[]) => void | UploadListeners<TEndpoint>;
	onUploadAborted?: () => Promise<void> | void;
};

export type UploadthingImageConfig = {
	maxFileSize: NonNullable<ExpandedRouteConfig["image"]>["maxFileSize"];
	maxWidth: number | undefined;
	maxHeight: number | undefined;
	recommendedWidth: number | undefined;
	recommendedHeight: number | undefined;
};

export type UseUploaderReturn<TEndpoint extends keyof UploadsRouter> = {
	readonly isUploading: boolean;
	readonly routeConfig: ExpandedRouteConfig | undefined;
	readonly imageConfig: UploadthingImageConfig | null;
	startUpload: UploadthingInterface<TEndpoint>["startUpload"];
	abortUpload: () => void;
};

export function useUploader<TEndpoint extends keyof UploadsRouter>(
	endpoint: TEndpoint,
	opts?: UseUploaderOptions<TEndpoint>
): UseUploaderReturn<TEndpoint> {
	const convex = useConvex();
	const abortController = new AbortController();

	let listeners = $state<UploadListeners<TEndpoint> | null>(null);

	const {
		startUpload,
		isUploading: isUploadingStore,
		routeConfig: routeConfigStore
	} = createUploadThing(endpoint, {
		...opts,
		signal: abortController.signal,
		headers: async () => {
			const auth = convex.getAuth();

			const headers = new Headers(
				typeof opts?.headers === "function" ? await opts.headers() : opts?.headers
			);
			if (auth) {
				headers.set("x-convex-jwt", auth.token);
			}

			return headers;
		},
		async onBeforeUploadBegin(files) {
			if (opts?.onUpload) {
				listeners = opts.onUpload(files) ?? null;
			}

			if (opts?.onBeforeUploadBegin) {
				files = await opts.onBeforeUploadBegin(files);
			}

			return files;
		},
		onUploadBegin(fileName) {
			if (listeners?.onBegin) {
				listeners.onBegin(fileName);
			}
			if (opts?.onUploadBegin) {
				opts.onUploadBegin(fileName);
			}
		},
		onUploadProgress(progress) {
			if (listeners?.onProgress) {
				listeners.onProgress(progress);
			}
			if (opts?.onUploadProgress) {
				opts.onUploadProgress(progress);
			}
		},
		onClientUploadComplete(data) {
			try {
				console.log("Upload complete:", data);
				if (listeners?.onComplete) {
					listeners.onComplete(data);
				}
				if (opts?.onClientUploadComplete) {
					opts.onClientUploadComplete(data);
				}
			} finally {
				listeners = null;
			}
		},
		async onUploadError(err) {
			try {
				if (err instanceof UploadAbortedError) {
					console.error("Upload aborted:", err);
					if (listeners?.onAbort) {
						listeners.onAbort();
					}
					if (opts?.onUploadAborted) {
						await opts.onUploadAborted();
					}
					return;
				}

				console.error("Upload error:", err);
				if (listeners?.onError) {
					listeners.onError(err);
				}
				if (opts?.onUploadError) {
					await opts.onUploadError(err);
				}
			} finally {
				listeners = null;
			}
		}
	});

	const isUploading = $derived(fromStore(isUploadingStore).current);
	const routeConfig = $derived(fromStore(routeConfigStore).current);

	const imageConfig = $derived.by(() => {
		if (!routeConfig?.image) return null;

		return {
			maxFileSize: routeConfig.image.maxFileSize,
			maxWidth: routeConfig.image.additionalProperties?.width,
			maxHeight: routeConfig.image.additionalProperties?.height,
			recommendedWidth: routeConfig.image.additionalProperties?.recommendedWidth,
			recommendedHeight: routeConfig.image.additionalProperties?.recommendedHeight
		} as UploadthingImageConfig;
	});

	return {
		get isUploading() {
			return isUploading;
		},
		get routeConfig() {
			return routeConfig;
		},
		get imageConfig() {
			return imageConfig;
		},
		startUpload,
		abortUpload() {
			abortController.abort();
		}
	} as UseUploaderReturn<TEndpoint>;
}

export function createUploadToast(assetName: string, files: File[]) {
	const toast = progressToast({
		title: `Uploading ${assetName}...`,
		description: files[0].name,
		hideClose: true
	});

	function startClose({ delay = 5000, ...data }: ToastConfig) {
		let timeElapsed = 0;
		const frames = new AnimationFrames(({ delta }) => {
			timeElapsed += delta;
			updateToast(toast.toast.id, {
				...data,
				customPercentage: (100 * timeElapsed) / delay
			});

			if (timeElapsed > delay) {
				toast.complete();
				frames.stop();
			}
		});
	}

	return {
		onBegin() {
			toast.setProgress(10);
		},
		onProgress(progress) {
			toast.setProgress(10 + (progress / 100) * 90);
		},
		onAbort() {
			toast.complete();
		},
		onComplete() {
			startClose({
				variant: "success",
				title: `${assetName.toTitleCase()} uploaded`,
				description: `${assetName.toTitleCase()} has been uploaded successfully`,
				customPercentage: null
			});
		},
		onError(e) {
			if (e.code === "FORBIDDEN") {
				startClose({
					variant: "destructive",
					title: `You do not have permission to upload a${/^[aeiou]/.test(assetName) ? "n" : ""} ${assetName}`,
					description: "Missing permission: " + (e.data?.missingPermission ?? "unknown"),
					customPercentage: null
				});
				return;
			}

			console.error(e.data);
			startClose({
				variant: "destructive",
				title: `Failed to upload ${assetName}`,
				description: e.data?.message ?? e.data?.type ?? e.code,
				customPercentage: null
			});
		}
	} satisfies UploadListeners<any>;
}
