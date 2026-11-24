import { createLogger } from "@versetools/observability";
import { tslog } from "@versetools/observability/loggers/tslog";

export const prod = process.env.NODE_ENV === "production";

export const logger = createLogger({
	base: tslog({
		name: "bot",
		type: !prod ? "pretty" : "json",
		pretty: {
			template: !prod ? "[{{name}}] {{logLevelName}} " : undefined
		}
	})
});
