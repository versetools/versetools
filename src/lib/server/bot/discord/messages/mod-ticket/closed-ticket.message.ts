import { defineMessage, okReply } from "@versetools/discord.js-helpers";
import { ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags } from "discord.js";

import { ButtonCustomId } from "../../ids";

export const closedTicketMessage = defineMessage({
	build: (closedById: string, reason?: string) => {
		const container = new ContainerBuilder();

		container
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(
					`## Closed
Ticket closed by <@${closedById}>${reason ? `\n### Reason\n${reason}` : ""}`
				)
			)
			.addActionRowComponents((actionRow) =>
				actionRow.addComponents(
					new ButtonBuilder()
						.setCustomId(ButtonCustomId.ReopenModTicket)
						.setLabel("Reopen ticket")
						.setStyle(ButtonStyle.Primary)
				)
			);

		return okReply({
			flags: MessageFlags.IsComponentsV2,
			components: [container]
		});
	}
});
