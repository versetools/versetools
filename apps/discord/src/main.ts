import "@l3dev/mixins";

import { config } from "@versetools/core/config";
import { ActivityType } from "discord.js";
import { Bot } from "discordthing";

import { logger, addLoggerTransports } from "./logger";
const bot = new Bot(
	{
		name: "Versetools",
		logger,
		listeners: []
	},
	{
		intents: ["Guilds", "GuildMembers", "GuildMessagePolls"],
		presence: {
			activities: [
				{
					type: ActivityType.Watching,
					name: `${config.domain} | ${config.parent.name}`,
					url: `https://${config.domain}`
				}
			]
		}
	}
);

addLoggerTransports(bot);

async function main() {
	await bot.start(process.env.DISCORD_TOKEN!);
}

void main();
