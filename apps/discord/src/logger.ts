import { axiomTransport } from "@versetools/observability/transports";
import type { Bot } from "discordthing";
import { Logger } from "tslog";

export const prod = process.env.NODE_ENV === "production";

export const logger = new Logger(
	{
		name: "main",
		type: !prod ? "pretty" : "json",
		prettyLogTemplate: !prod ? "[{{name}}] {{logLevelName}} " : undefined
	},
	{}
);

export function addLoggerTransports(bot: Bot) {
	if (!prod) {
		return;
	}

	logger.attachTransport(
		axiomTransport({
			token: process.env.AXIOM_TOKEN!,
			dataset: process.env.AXIOM_DATASET!,
		})
	);
}
