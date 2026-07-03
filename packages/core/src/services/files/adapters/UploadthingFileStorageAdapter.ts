import { err, ok } from "@l3dev/result";

import type { FileStorageAdapterInterface } from "./FileStorageAdapterInterface";
import FetchClient from "../../../requests/FetchClient";
import DeleteFilesRequest from "../../../requests/files/uploadthing/DeleteFilesRequest";

export default class UploadthingFileStorageAdapter implements FileStorageAdapterInterface {
	private readonly api: FetchClient;

	constructor(apiKey: string) {
		this.api = new FetchClient("https://api.uploadthing.com", {
			"x-uploadthing-version": "7.7.4",
			"x-uploadthing-be-adapter": "custom-convex",
			"x-uploadthing-api-key": apiKey
		});
	}

	async deleteFiles(keys: string[]) {
		const request = new DeleteFilesRequest(keys);

		const result = await this.api.fetchAndDecode(request);
		if (!result.ok) {
			return result;
		}

		const { response, body } = result.value;

		if (!response.ok || !body.success) {
			return err(("type" in body ? body.type : null) ?? "UNKNOWN_ERROR", {
				response: await this.api.serializeResponse(response)
			});
		}

		return ok(body);
	}
}
