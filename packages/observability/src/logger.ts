import { LogLayer, type LogLayerConfig, type LogLayerTransport } from "loglayer";
import { serializeError } from "serialize-error";

export type LoggerSettings = {
	base: LogLayerTransport;
	transports?: LogLayerTransport<any>[];
} & Omit<LogLayerConfig, "transport">;

export function createLogger(settings: LoggerSettings) {
	return new LogLayer({
		errorSerializer: serializeError,
		...settings,
		transport: [settings.base, ...(settings.transports ?? [])]
	});
}
