import type { HttpRequestContract, HttpRequestInterface } from "../../HttpRequestInterface";

export default class DeleteFilesRequest implements HttpRequestInterface {
	public readonly name = "UPLOADTHING_DELETE_FILES";

	declare readonly decodedType:
		| {
				success: true;
				deletedCount: number;
		  }
		| {
				success: false;
				type: string;
		  };

	constructor(private readonly keys: string[]) {}

	buildRequest(): HttpRequestContract {
		return {
			path: "/v6/delete-files",
			method: "POST",
			body: JSON.stringify({
				fileKeys: this.keys
			}),
			headers: {
				"Content-Type": "application/json"
			}
		};
	}
}
