import { ConsoleTransport, type LogLevelType } from "loglayer";

export type ConsoleLoggerSettings = {
	enabled?: boolean;
	minimumLevel?: LogLevelType;
};

function _console(settings: ConsoleLoggerSettings) {
	return new ConsoleTransport({
		id: "console",
		enabled: settings.enabled,
		logger: console,
		level: settings.minimumLevel,
		messageField: "_log"
	});
}

export { _console as console };
