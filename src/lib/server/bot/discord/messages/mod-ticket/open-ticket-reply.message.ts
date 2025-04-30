import { defineMessage, okReply } from "@versetools/discord.js-helpers";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from "discord.js";

import { env } from "$env/dynamic/private";

export const openTicketReplyMessage = defineMessage({
	build: (threadId: string) => {
		return okReply({
			flags: MessageFlags.Ephemeral,
			content:
				"Thank you for your report! Please add any additional information and screenshots here:",
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setLabel("Go to ticket")
						.setStyle(ButtonStyle.Link)
						.setURL(`https://discord.com/channels/${env.DISCORD_GUILD_ID}/${threadId}`)
				)
			]
		});
	}
});
