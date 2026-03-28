import { AsyncLocalStorage } from "node:async_hooks";

const asyncLocalStorage = new AsyncLocalStorage<{ request: Request }>();

export const requestLogObj = {
	request: () => {
		const request = asyncLocalStorage.getStore()?.request;
		if (!request) {
			return null;
		}

		const requestId = request.headers.has("cf-ray")
			? `cf:${request.headers.get("cf-ray")}`
			: crypto.randomUUID();

		return {
			...parseRequest(request),
			id: requestId
		};
	}
};

export async function withRequest<T>(request: Request, wrapped: () => T) {
	return await asyncLocalStorage.run({ request }, wrapped);
}

export function parseRequest(request: Request) {
	return {
		url: request.url,
		method: request.method,
		headers: Object.fromEntries(request.headers.entries())
	};
}
