import { type InferSelectModel } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export type DbModTicket = InferSelectModel<typeof modTickets>;

export const modTickets = pgTable("mod_tickets", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

	issueDescription: text("issue_description").notNull(),

	openedByDiscordId: text("opened_by_discord_id").notNull(),
	openedByDiscordUsername: text("opened_by_discord_username").notNull(),

	discordThreadId: text("discord_thread_id"),

	closedReason: text("closed_reason"),
	closedByDiscordId: text("closed_by_discord_id"),
	closedByDiscordUsername: text("closed_by_discord_username"),
	closedDiscordMessageId: text("closed_discord_message_id"),
	closedAt: timestamp("closed_at"),

	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdateFn(() => new Date()),
	createdAt: timestamp("created_at").notNull().defaultNow()
});

export type DbBugTicket = InferSelectModel<typeof bugTickets>;

export const bugTickets = pgTable("bug_tickets", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

	email: text("email").notNull(),
	service
	issueDescription: text("issue_description").notNull(),

	openedByDiscordId: text("opened_by_discord_id").notNull(),
	openedByDiscordUsername: text("opened_by_discord_username").notNull(),

	discordThreadId: text("discord_thread_id"),

	closedReason: text("closed_reason"),
	closedByDiscordId: text("closed_by_discord_id"),
	closedByDiscordUsername: text("closed_by_discord_username"),
	closedDiscordMessageId: text("closed_discord_message_id"),
	closedAt: timestamp("closed_at"),

	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdateFn(() => new Date()),
	createdAt: timestamp("created_at").notNull().defaultNow()
});

export const ticketTables = {
	modTickets,
	bugTickets
};
