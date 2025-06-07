import { getMessage } from "@l3dev/discord.js-helpers";
import { err, ok, Result } from "@l3dev/result";
import {
	ChannelType,
	MessageFlags,
	ThreadAutoArchiveDuration,
	type ButtonInteraction,
	type ModalSubmitInteraction,
	type PrivateThreadChannel,
	type PublicThreadChannel,
	type TextChannel
} from "discord.js";
import { and, count, eq, isNull } from "drizzle-orm";

import { db, safeExecute, tables } from "../../../../db";
import { CloseModTicketInputCustomId, OpenModTicketInputCustomId } from "../../ids";
import { closedTicketMessage } from "../../messages/mod-ticket/closed-ticket.message";
import { ticketDetailsMessage } from "../../messages/mod-ticket/ticket-details.message";

export const MAX_ACTIVE_TICKETS_PER_USER = 3;

export function getTicketByThreadId(threadId: string) {
	return safeExecute(
		"MOD_TICKET_QUERY",
		db.query.modTickets.findFirst({
			where: (t, { eq }) => eq(t.discordThreadId, threadId)
		})
	);
}

export async function checkTicketLimit(interaction: ModalSubmitInteraction) {
	const activeTicketCountResult = await safeExecute(
		"MOD_TICKET_COUNT",
		db
			.select({ count: count() })
			.from(tables.modTickets)
			.where(
				and(
					eq(tables.modTickets.openedByDiscordId, interaction.user.id),
					isNull(tables.modTickets.closedAt)
				)
			)
	);
	if (!activeTicketCountResult.ok) {
		return activeTicketCountResult;
	}

	return ok(activeTicketCountResult.value[0].count < MAX_ACTIVE_TICKETS_PER_USER);
}

export async function createTicket(interaction: ModalSubmitInteraction, channel: TextChannel) {
	const issueDescription = interaction.fields.getTextInputValue(
		OpenModTicketInputCustomId.IssueDescription
	);

	const tx = await db.inlineTransaction();
	const ticketResult = await safeExecute(
		"INSERT_MOD_TICKET",
		tx
			.insert(tables.modTickets)
			.values({
				issueDescription,
				openedByDiscordId: interaction.user.id,
				openedByDiscordUsername: interaction.user.username
			})
			.returning({
				id: tables.modTickets.id
			})
	);
	if (!ticketResult.ok) {
		return await tx.rollback(() => ticketResult);
	}

	const ticket = ticketResult.value[0];

	const createThreadResult = await Result.fromPromise(
		{ onError: { type: "CREATE_MOD_TICKET_THREAD" } },
		channel.threads.create({
			type: ChannelType.PrivateThread,
			name: `ticket-${ticket.id}`,
			reason: `Create moderation ticket thread for ticket ${ticket.id}`,
			autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
			invitable: false
		})
	);
	if (!createThreadResult.ok) {
		return await tx.rollback(() => createThreadResult);
	}

	const thread = createThreadResult.value;

	const updateTicketResult = await safeExecute(
		"UPDATE_MOD_TICKET_WITH_THREAD",
		tx
			.update(tables.modTickets)
			.set({ discordThreadId: thread.id })
			.where(eq(tables.modTickets.id, ticket.id))
	);
	if (!updateTicketResult.ok) {
		return await tx.rollback(async () => {
			await thread.delete();
			return updateTicketResult;
		});
	}

	const sendStartMessageResult = await Result.fromPromise(
		thread.send({
			...ticketDetailsMessage.build(ticket.id, interaction.user.id, issueDescription).value
		})
	);
	if (!sendStartMessageResult.ok) {
		return await tx.rollback(async () => {
			await thread.delete();
			return sendStartMessageResult;
		});
	}

	const addUserResult = await Result.fromPromise(
		{ onError: { type: "ADD_USER_TO_THREAD" } },
		thread.members.add(interaction.user.id)
	);
	if (!addUserResult.ok) {
		return await tx.rollback(async () => {
			await thread.delete();
			return addUserResult;
		});
	}

	return await tx.commit(() => ok({ ticket, thread }));
}

export async function closeTicket(
	interaction: ButtonInteraction | ModalSubmitInteraction,
	thread: PublicThreadChannel<boolean> | PrivateThreadChannel
) {
	const ticketResult = await getTicketByThreadId(thread.id);
	if (!ticketResult.ok) {
		return ticketResult;
	}

	const ticket = ticketResult.value;
	if (!ticket) {
		return err("MOD_TICKET_NOT_FOUND");
	}

	if (ticket.closedAt) {
		return await Result.fromPromise(
			{ onError: { type: "REPLY_ALREADY_CLOSED_MOD_TICKET" } },
			interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: "This ticket has already been closed"
			})
		);
	}

	let reason: string | null = null;
	if (interaction.isModalSubmit()) {
		reason = interaction.fields.getTextInputValue(CloseModTicketInputCustomId.Reason);
	}

	const sendCloseMessageResult = await Result.fromPromise(
		{ onError: { type: "REPLY_CLOSED_MOD_TICKET" } },
		interaction.reply({
			...closedTicketMessage.build(interaction.user.id, reason ?? undefined).value
		})
	);
	if (!sendCloseMessageResult.ok) {
		return sendCloseMessageResult;
	}

	const closeMessage = sendCloseMessageResult.value;

	const tx = await db.inlineTransaction();
	const closeTicketResult = await safeExecute(
		"CLOSE_MOD_TICKET",
		tx
			.update(tables.modTickets)
			.set({
				closedReason: reason,
				closedByDiscordId: interaction.user.id,
				closedByDiscordUsername: interaction.user.username,
				closedDiscordMessageId: closeMessage.id,
				closedAt: new Date()
			})
			.where(eq(tables.modTickets.discordThreadId, thread.id))
	);
	if (!closeTicketResult.ok) {
		return await tx.rollback(async () => {
			await closeMessage.delete();
			return closeTicketResult;
		});
	}

	const closeThreadResult = await Result.fromPromise(
		{ onError: { type: "CLOSE_MOD_TICKET_THREAD" } },
		thread.setArchived(true, "Close moderation ticket")
	);
	if (!closeThreadResult.ok) {
		return await tx.rollback(async () => {
			await closeMessage.delete();
			return closeThreadResult;
		});
	}

	return await tx.commit(() => closeTicketResult);
}

export async function reopenTicket(
	interaction: ButtonInteraction,
	thread: PublicThreadChannel<boolean> | PrivateThreadChannel
) {
	const ticketResult = await getTicketByThreadId(thread.id);
	if (!ticketResult.ok) {
		return ticketResult;
	}

	const ticket = ticketResult.value;
	if (!ticket) {
		return err("MOD_TICKET_NOT_FOUND");
	}

	const tx = await db.inlineTransaction();
	const reopenTicketResult = await safeExecute(
		"REOPEN_MOD_TICKET",
		tx
			.update(tables.modTickets)
			.set({
				closedReason: null,
				closedByDiscordId: null,
				closedByDiscordUsername: null,
				closedDiscordMessageId: null,
				closedAt: null
			})
			.where(eq(tables.modTickets.id, ticket.id))
	);
	if (!reopenTicketResult.ok) {
		return await tx.rollback(() => reopenTicketResult);
	}

	if (ticket.closedDiscordMessageId) {
		const getCloseMessageResult = await getMessage(thread, ticket.closedDiscordMessageId);
		if (!getCloseMessageResult.ok) {
			return await tx.rollback(() => getCloseMessageResult);
		}

		const closeMessage = getCloseMessageResult.value;

		const deleteCloseMessageResult = await Result.fromPromise(
			{ onError: { type: "DELETE_CLOSE_MOD_TICKET_MESSAGE" } },
			closeMessage.delete()
		);
		if (!deleteCloseMessageResult.ok) {
			return await tx.rollback(() => deleteCloseMessageResult);
		}
	}

	const openThreadResult = await Result.fromPromise(
		{ onError: { type: "OPEN_MOD_TICKET_THREAD" } },
		thread.setArchived(false, "Reopen moderation ticket")
	);
	if (!openThreadResult.ok) {
		return await tx.rollback(() => openThreadResult);
	}

	const sendReopenMessageResult = await Result.fromPromise(
		{ onError: { type: "REPLY_REOPEN_MOD_TICKET" } },
		interaction.reply({
			content: `<@${interaction.user.id}> reopened the ticket`
		})
	);
	if (!sendReopenMessageResult.ok) {
		return await tx.rollback(async () => {
			thread.setArchived(true, "Rollback 'Reopen moderation ticket'");
			return sendReopenMessageResult;
		});
	}

	return await tx.commit(() => reopenTicketResult);
}
