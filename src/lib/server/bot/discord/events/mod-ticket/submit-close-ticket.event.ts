import { defineEventListener } from "@l3dev/discord.js-helpers";
import { err, NONE, Result } from "@l3dev/result";
import { Events, MessageFlags } from "discord.js";

import { env } from "$env/dynamic/private";

import { ButtonCustomId } from "../../ids";
import { errorMessage } from "../../messages/error.message";
import { closeTicket } from "../../modules/mod-tickets/mod-tickets";

export default defineEventListener({
	event: Events.InteractionCreate,
	listener: async function (interaction) {
		if (
			interaction.guild?.id !== env.DISCORD_GUILD_ID ||
			!interaction.isModalSubmit() ||
			interaction.customId !== ButtonCustomId.CloseModTicketModal
		) {
			return NONE;
		}

		if (!interaction.channel?.isThread()) {
			return err("EXPECTED_MOD_TICKET_THREAD");
		}

		const closeTicketResult = await closeTicket(interaction, interaction.channel);
		if (!closeTicketResult.ok) {
			const replyErrorResult = await Result.fromPromise(
				interaction.reply({
					...errorMessage.build("Failed to close ticket, please try again later").value,
					flags: MessageFlags.Ephemeral
				})
			);
			return Result.all(closeTicketResult, replyErrorResult);
		}

		return NONE;
	}
});
