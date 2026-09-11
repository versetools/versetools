import type { ReturnResult } from "@l3dev/result";

export interface FileStorageAdapterInterface {
	urlFromKey(key: string): string;
	deleteFiles(keys: string[]): Promise<ReturnResult<{ deletedCount: number }, any>>;
}
