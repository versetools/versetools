import { AsyncLocalStorage } from "node:async_hooks";
import type { Span } from "@opentelemetry/api";

const asyncLocalStorage = new AsyncLocalStorage<{ span: Span }>();

export const tracingLogObj = {
	tracing: () => {
		const span = asyncLocalStorage.getStore()?.span;
		if (!span) {
			return null;
		}

		const context = span.spanContext();

		return {
			traceId: context.traceId,
			spanId: context.spanId
		};
	}
};

export async function withTracing<T>(span: Span, wrapped: () => T) {
	return await asyncLocalStorage.run({ span }, wrapped);
}
