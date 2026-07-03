import type { ReturnResult } from "@l3dev/result";

export interface FileStorageAdapterInterface {
	deleteFiles(keys: string[]): Promise<ReturnResult<{ deletedCount: number }, any>>;
}
