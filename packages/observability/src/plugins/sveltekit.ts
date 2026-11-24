import { AsyncLocalStorage } from "node:async_hooks";

import type { LogLayerPlugin, LogLayerPluginParams } from "@loglayer/plugin";
import type { RequestEvent } from "@sveltejs/kit";

const asyncLocalStorage = new AsyncLocalStorage<{ event: RequestEvent }>();

export type SveltekitPluginParams = LogLayerPluginParams & {
	requestIdField?: string;
	clientIpField?: string;
};

export function sveltekitPlugin(params: SveltekitPluginParams = {}): LogLayerPlugin {
	const requestIdField = params.requestIdField ?? "request_id";
	const clientIpField = params.clientIpField ?? "potential_client_ip";

	return {
		id: params.id,
		disabled: params.disabled,
		onBeforeDataOut({ data }) {
			const event = asyncLocalStorage.getStore()?.event;
			if (!event) {
				return data ?? {};
			}

			const request = event.request;
			const requestId = request.headers.has("cf-ray")
				? `cf:${request.headers.get("cf-ray")}`
				: `uuid:${crypto.randomUUID()}`;

			return {
				...data,
				[requestIdField]: requestId,
				[clientIpField]: event.getClientAddress()
			};
		}
	};
}

export function withSveltekitEvent<T>(event: RequestEvent, wrapped: () => T) {
	return asyncLocalStorage.run({ event }, wrapped);
}
