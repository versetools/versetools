import { registerCommands, registerEventListeners } from "@l3dev/discord.js-helpers";
import { logger } from "@l3dev/logger";
import { ActivityType, Client, REST } from "discord.js";

import { env } from "$env/dynamic/private";
import { config } from "$lib/config";

import { commands } from "./commands";
import { eventListeners } from "./events";

export async function startDiscordBot() {
	const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);
	const client = new Client({
		intents: ["Guilds", "GuildMembers", "GuildMessagePolls"],
		presence: {
			activities: [
				{
					type: ActivityType.Custom,
					name: config.domain,
					url: `https://${config.domain}`
				}
			]
		}
	});

	registerEventListeners({ client, eventListeners, logger });
	client.on("ready", async () => {
		await registerCommands({ client, rest, guildId: env.DISCORD_GUILD_ID, commands, logger });
		logger.log("Discord bot is ready");
	});

	client.login(env.DISCORD_TOKEN);

	import.meta.hot?.on("vite:beforeUpdate", () => {
		client.destroy();
	});
}
