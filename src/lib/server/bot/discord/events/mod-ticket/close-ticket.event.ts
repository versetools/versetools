import { defineEventListener } from "@versetools/discord.js-helpers";
import { err, NONE, Result } from "@versetools/result";
import {
	ActionRowBuilder,
	Events,
	MessageFlags,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle
} from "discord.js";

import { env } from "$env/dynamic/private";

import { ButtonCustomId, CloseModTicketInputCustomId } from "../../ids";
import { errorMessage } from "../../messages/error.message";
import { closeTicket } from "../../mod-tickets";

export default defineEventListener({
	event: Events.InteractionCreate,
	listener: async function (interaction) {
		if (
			interaction.guild?.id !== env.DISCORD_GUILD_ID ||
			!interaction.isButton() ||
			![ButtonCustomId.CloseModTicket, ButtonCustomId.CloseModTicketWithReason].includes(
				interaction.customId as ButtonCustomId
			)
		) {
			return NONE;
		}

		if (interaction.customId === ButtonCustomId.CloseModTicket) {
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

		const modal = new ModalBuilder()
			.setCustomId(ButtonCustomId.CloseModTicketModal)
			.setTitle("Close ticket")
			.addComponents(
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId(CloseModTicketInputCustomId.Reason)
						.setLabel("Reason")
						.setStyle(TextInputStyle.Short)
						.setRequired(true)
				)
			);

		const showModalResult = await Result.fromPromise(interaction.showModal(modal));
		if (!showModalResult.ok) return showModalResult;

		return NONE;
	}
});
