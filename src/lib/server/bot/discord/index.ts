import { registerCommands, registerEventListeners } from "@versetools/discord.js-helpers";
import { ActivityType, Client, REST } from "discord.js";

import { env } from "$env/dynamic/private";
import { config } from "$lib/config";
import { logger } from "$server/utils/logger";

import { commands } from "./commands";
import { eventListeners } from "./events";

// export async function load(client: Client, rest: REST, guildId: string) {
// 	return Result.all(
// 		await registerCommands({ client, rest, guildId, commands, logger }),
// 		registerEventListeners({ client, eventListeners, logger })
// 	);
// }

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
