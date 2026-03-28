import type { DataModel } from "$convex/_generated/dataModel";
import { Result } from "@l3dev/result";
import { APIBase } from "@versetools/core/apis";
import { ResultError } from "@versetools/core/errors";

export class FileStorageAPI extends APIBase<DataModel> {
	async deleteFiles(keys: string[]) {
		const result = await this.safeFetch(
			"DELETE_FILES",
			`${process.env.SITE_URL!}/api/internal/delete-files`,
			{
				method: "POST",
				body: JSON.stringify({
					keys
				}),
				headers: {
					"Content-Type": "application/json",
					"x-api-secret": process.env.CONVEX_SECRET!
				}
			}
		);

		if (!result.ok) {
			throw ResultError.from(result);
		}

		const response = result.value;
		const parseResult = await Result.fromPromise(response.json(), {
			onError: { type: "DELETE_FILES_PARSE" }
		});
		if (!parseResult.ok) {
			throw ResultError.from(parseResult);
		}

		const body = parseResult.value as
			| {
					success: true;
					deletedCount: number;
			  }
			| {
					success: false;
					type: string;
			  };

		if (!response.ok || !body.success) {
			console.error("[FileStorage.deleteFiles] Delete files request failed:", body);
			throw new ResultError(("type" in body ? body.type : null) ?? "UNKNOWN_ERROR", {
				response: await this.serializeResponse(response)
			});
		}

		console.log(
			`[FileStorage.deleteFiles] Successfully deleted ${body.deletedCount} files from storage`
		);
	}
}
