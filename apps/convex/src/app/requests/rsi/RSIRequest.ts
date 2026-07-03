import type {
	HttpRequestContract,
	HttpRequestInterface
} from "@versetools/core/requests/HttpRequestInterface";

export type RSIRequestContract = Pick<HttpRequestContract, "path" | "method" | "headers"> & {
	body?: object;
	credentials?: {
		deviceId?: string;
		token?: string;
	};
};

export abstract class RSIRequest implements HttpRequestInterface {
	abstract readonly name: string;
	declare abstract readonly decodedType: any;

	constructor() {}

	abstract buildRSIRequest(): RSIRequestContract;

	buildRequest(): HttpRequestContract {
		const { headers: headersInit, body, credentials, ...rsiRequest } = this.buildRSIRequest();

		const headers = new Headers(headersInit);
		headers.set("Content-Type", "application/json");

		if (credentials?.deviceId) {
			headers.set("X-Device-Id", credentials.deviceId);
		}
		if (credentials?.token) {
			headers.set("X-Rsi-Token", credentials.token);
		}

		return {
			...rsiRequest,
			body: body ? JSON.stringify(body) : undefined,
			headers
		};
	}
}
