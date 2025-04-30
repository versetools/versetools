import { defineEventListener, getChannel } from "@versetools/discord.js-helpers";
import { err, NONE, Result } from "@versetools/result";
import { ChannelType, Events, MessageFlags } from "discord.js";

import { env } from "$env/dynamic/private";

import { ChannelIds, ButtonCustomId } from "../../ids";
import { errorMessage } from "../../messages/error.message";
import { openTicketReplyMessage } from "../../messages/mod-ticket/open-ticket-reply.message";
import { checkTicketLimit, createTicket, MAX_ACTIVE_TICKETS_PER_USER } from "../../mod-tickets";

export default defineEventListener({
	event: Events.InteractionCreate,
	listener: async function (interaction) {
		if (
			interaction.guild?.id !== env.DISCORD_GUILD_ID ||
			!interaction.isModalSubmit() ||
			interaction.customId !== ButtonCustomId.OpenModTicketModal
		) {
			return NONE;
		}

		const channelResult = await getChannel(interaction.client, ChannelIds.moderationTickets);
		if (!channelResult.ok) return channelResult;

		const channel = channelResult.value;
		if (!channel || channel.type !== ChannelType.GuildText) {
			return err("CHANNEL_CANNOT_HAVE_THREADS");
		}

		const checkTicketLimitResult = await checkTicketLimit(interaction);
		if (!checkTicketLimitResult.ok) {
			const replyErrorResult = await Result.fromPromise(
				interaction.reply({
					...errorMessage.build("Failed to create ticket, please try again later").value,
					flags: MessageFlags.Ephemeral
				})
			);
			return Result.all(checkTicketLimitResult, replyErrorResult);
		}

		if (!checkTicketLimitResult.value) {
			return await Result.fromPromise(
				{ onError: { type: "REPLY_MAX_ACTIVE_TICKETS_PER_USER_FAILED" } },
				interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: `You can only have a maximum of ${MAX_ACTIVE_TICKETS_PER_USER} tickets open at once`
				})
			);
		}

		const createTicketResult = await createTicket(interaction, channel);
		if (!createTicketResult.ok) {
			const replyErrorResult = await Result.fromPromise(
				interaction.reply({
					...errorMessage.build("Failed to create ticket, please try again later").value,
					flags: MessageFlags.Ephemeral
				})
			);
			return Result.all(createTicketResult, replyErrorResult);
		}

		const { thread } = createTicketResult.value;

		return await Result.fromPromise(
			{ onError: { type: "REPLY_MOD_TICKET_OPENED_FAILED" } },
			interaction.reply({
				...openTicketReplyMessage.build(thread.id).value
			})
		);
	}
});
