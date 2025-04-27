import { defineEventListener } from "@versetools/discord.js-helpers";
import { err, NONE } from "@versetools/result";
import { Events } from "discord.js";

import { env } from "$env/dynamic/private";

import { commands } from "../commands";
import { commandExecutor } from "../commands/executor";
import { errorMessage } from "../messages/error.message";

export default defineEventListener({
	event: Events.InteractionCreate,
	listener: async function (interaction) {
		if (interaction.user.bot || !interaction.isChatInputCommand()) return NONE;

		const command = commands.get(interaction.commandName);

		if (!command) {
			if (interaction.guildId === env.DISCORD_GUILDID) {
				await interaction.reply({
					...errorMessage.build("Command not found").value,
					ephemeral: true
				});
				return err("UNKNOWN_COMMAND", {
					command: interaction.commandName,
					interactionId: interaction.id
				});
			}
			return NONE;
		}

		return commandExecutor(command, interaction);
	}
});
