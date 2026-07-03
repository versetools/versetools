import { ResultError } from "@versetools/core/errors";

import type { FileStorageAdapterInterface } from "./adapters/FileStorageAdapterInterface";

export default class FileStorageService {
	constructor(protected readonly adapter: FileStorageAdapterInterface) {}

	async deleteFiles(keys: string[]) {
		const result = await this.adapter.deleteFiles(keys);

		if (!result.ok) {
			console.error("[FileStorage.deleteFiles] Delete files request failed:", result);
			throw ResultError.from(result);
		}

		console.log(
			`[FileStorage.deleteFiles] Successfully deleted ${result.value.deletedCount} files from storage`
		);
	}
}
