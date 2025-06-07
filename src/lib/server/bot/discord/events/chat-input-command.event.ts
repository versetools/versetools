import { defineEventListener } from "@l3dev/discord.js-helpers";
import { err, NONE } from "@l3dev/result";
import { Events, MessageFlags } from "discord.js";

import { env } from "$env/dynamic/private";

import { commands } from "../commands";
import { commandExecutor } from "../commands/executor";
import { errorMessage } from "../messages/error.message";

export default defineEventListener({
	event: Events.InteractionCreate,
	listener: async function (interaction) {
		if (
			interaction.user.bot ||
			!interaction.isChatInputCommand() ||
			interaction.guildId !== env.DISCORD_GUILDID
		)
			return NONE;

		const command = commands.get(interaction.commandName);

		if (!command) {
			await interaction.reply({
				...errorMessage.build("Command not found").value,
				flags: MessageFlags.Ephemeral
			});
			return err("UNKNOWN_COMMAND", {
				command: interaction.commandName,
				interactionId: interaction.id
			});
		}

		return commandExecutor(command, interaction);
	}
});
