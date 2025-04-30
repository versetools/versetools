import { defineMessage, okMessage } from "@versetools/discord.js-helpers";
import { ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags } from "discord.js";

import { config } from "$lib/config";

import { ButtonCustomId, RoleIds } from "../../ids";

export const openTicketMessage = defineMessage({
	build: () => {
		const container = new ContainerBuilder();

		container.addSectionComponents((section) =>
			section
				.addTextDisplayComponents((textDisplay) => textDisplay.setContent("# Moderation Ticket"))
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(ButtonCustomId.OpenModTicket)
						.setLabel("Open a ticket")
						.setStyle(ButtonStyle.Primary)
				)
		);
		container.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(
				`If you require the assistance from a <@&${RoleIds.moderator}> please open a ticket by clicking the button above and someone will get back to you as soon as possible.
				
-# For product related enquires and support please use the respective support channels or you can email us at [${config.emails.support}](mailto:${config.emails.support})`
			)
		);

		return okMessage({
			flags: MessageFlags.IsComponentsV2,
			components: [container]
		});
	}
});
