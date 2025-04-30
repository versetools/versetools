import { defineMessage, okMessage } from "@versetools/discord.js-helpers";
import {
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	MessageFlags,
	SeparatorSpacingSize
} from "discord.js";

import { ButtonCustomId, RoleIds } from "../../ids";

export const ticketDetailsMessage = defineMessage({
	build: (ticketId: number, userId: string, issueDescription: string) => {
		const container = new ContainerBuilder()
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(`## Ticket #${ticketId}
<@${userId}> Thank you for opening a ticket!

This ticket is for reporting issues with other users of this Discord server. Please add any additional information and relevant screenshots.

A <@&${RoleIds.moderator}> will get back to you as soon as possible.`)
			)
			.addSeparatorComponents((separator) =>
				separator.setDivider(true).setSpacing(SeparatorSpacingSize.Small)
			)
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(`### Described issue\n${issueDescription}`)
			)
			.addSeparatorComponents((separator) =>
				separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large)
			)
			.addActionRowComponents((actionRow) =>
				actionRow.addComponents(
					new ButtonBuilder()
						.setCustomId(ButtonCustomId.CloseModTicket)
						.setLabel("Close")
						.setStyle(ButtonStyle.Danger),
					new ButtonBuilder()
						.setCustomId(ButtonCustomId.CloseModTicketWithReason)
						.setLabel("Close with reason")
						.setStyle(ButtonStyle.Danger)
				)
			);

		return okMessage({
			flags: MessageFlags.IsComponentsV2,
			components: [container]
		});
	}
});
