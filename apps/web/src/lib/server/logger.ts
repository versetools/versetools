import { openTelemetryPlugin } from "@loglayer/plugin-opentelemetry";
import { createLogger } from "@versetools/observability";
import { tslog } from "@versetools/observability/loggers/tslog";
import { sveltekitPlugin } from "@versetools/observability/plugins/sveltekit";

import { dev } from "$app/environment";

export const logger = createLogger({
	base: tslog({ name: "server", type: dev ? "pretty" : "json" }),
	plugins: [openTelemetryPlugin({ id: "otel" }), sveltekitPlugin({ id: "sveltekit" })]
});
