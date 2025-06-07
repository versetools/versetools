import { defineEventListener } from "@l3dev/discord.js-helpers";
import { NONE, Result } from "@l3dev/result";
import {
	ActionRowBuilder,
	Events,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle
} from "discord.js";

import { env } from "$env/dynamic/private";

import { ButtonCustomId, OpenModTicketInputCustomId } from "../../ids";

export default defineEventListener({
	event: Events.InteractionCreate,
	listener: async function (interaction) {
		if (
			interaction.guild?.id !== env.DISCORD_GUILD_ID ||
			!interaction.isButton() ||
			interaction.customId !== ButtonCustomId.OpenModTicket
		) {
			return NONE;
		}

		const modal = new ModalBuilder()
			.setCustomId(ButtonCustomId.OpenModTicketModal)
			.setTitle("Create moderation ticket")
			.addComponents(
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId(OpenModTicketInputCustomId.IssueDescription)
						.setLabel("Describe the issue")
						.setStyle(TextInputStyle.Paragraph)
						.setRequired(true)
						.setMinLength(50)
				)
			);

		const showModalResult = await Result.fromPromise(interaction.showModal(modal));
		if (!showModalResult.ok) return showModalResult;

		return NONE;
	}
});
