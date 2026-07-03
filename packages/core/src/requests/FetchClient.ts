import { err, ok, Result } from "@l3dev/result";
import { MIMEType } from "whatwg-mimetype";
import * as YAML from "yaml";

import type { HttpRequestInterface } from "./HttpRequestInterface";

export default class FetchClient {
	constructor(
		protected readonly baseUrl: string | URL,
		protected readonly headers: HeadersInit = {}
	) {}

	public async fetch<const Request extends HttpRequestInterface>(request: Request) {
		const { path, headers: headersInit, ...contract } = request.buildRequest();
		const url = new URL(path, this.baseUrl);

		const headers = this.mergeHeaders(this.headers, headersInit ?? {});
		const promise = fetch(url, {
			...contract,
			headers
		});

		const result = await Result.fromPromise(promise, {
			onError: { type: request.name as Request["name"] }
		});

		if (!result.ok) {
			return err(result.type, {
				error: { name: result.context.error.name, message: result.context.error.message }
			});
		}

		return result;
	}

	public async fetchAndDecode<const Request extends HttpRequestInterface>(request: Request) {
		const result = await this.fetch(request);
		if (!result.ok) {
			return result;
		}

		const response = result.value;
		const fileExtension = new URL(response.url).pathname.split(".").pop();

		const mimeType = MIMEType.parse(response.headers.get("Content-Type") ?? "text/plain");

		let promise: Promise<any>;
		if (mimeType?.subtype === "json" || fileExtension === "json") {
			promise = response.json();
		} else if (
			mimeType?.subtype === "yaml" ||
			fileExtension === "yaml" ||
			fileExtension === "yml"
		) {
			promise = response.text().then((body) => YAML.parse(body));
		} else {
			promise = response.text();
		}

		const parseResult = await Result.fromPromise(promise, {
			onError: { type: `${request.name as Request["name"]}_DECODE` }
		});
		if (!parseResult.ok) {
			return parseResult;
		}

		return ok({
			response,
			body: parseResult.value as Request["decodedType"]
		});
	}

	public async serializeResponse(response: Response, body?: any) {
		return {
			url: response.url,
			status: response.status,
			statusText: response.statusText,
			headers: Object.fromEntries(response.headers.entries()),
			body: body ?? (response.body ? await response.text() : null)
		};
	}

	private mergeHeaders(...headers: HeadersInit[]) {
		const result = new Headers(headers[0]);

		for (const source of headers.slice(1)) {
			for (const [key, value] of new Headers(source).entries()) {
				if (value === undefined) {
					result.delete(key);
				} else {
					result.append(key, value);
				}
			}
		}

		return result;
	}
}
