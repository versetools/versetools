import { TsLogTransport } from "@loglayer/transport-tslog";
import type { LogLevelType } from "loglayer";
import { Logger, type ISettingsParam } from "tslog";

export type TslogLoggerSettings = {
	enabled?: boolean;
	minimumLevel?: LogLevelType;
} & Omit<ISettingsParam<any>, "attachedTransports" | "minLevel">;

export function tslog(settings: TslogLoggerSettings) {
	const { enabled, minimumLevel, ...rest } = settings;

	return new TsLogTransport({
		id: "tslog",
		enabled,
		logger: new Logger(rest),
		level: minimumLevel
	});
}
