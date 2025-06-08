import type { InteropServiceName } from "@versetools/interop";
import { type InferSelectModel } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import type { BugSeverity } from "$lib/shared/tickets/bug-severity";

export type DbBugTicket = InferSelectModel<typeof bugTickets>;

export const bugTickets = pgTable("bug_tickets", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

	email: text("email").notNull(),
	userAgent: text("user_agent").notNull(),

	service: text("service").notNull().$type<InteropServiceName>(),
	issueDescription: text("issue_description").notNull(),
	reproductionSteps: text("reproduction_steps").notNull(),
	expectedOutcome: text("expected_outcome").notNull(),
	severity: text("severity").notNull().$type<BugSeverity>(),

	attachmentFileKeys: text("attachment_file_keys").array(),

	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdateFn(() => new Date()),
	createdAt: timestamp("created_at").notNull().defaultNow()
});

export const ticketTables = {
	bugTickets
};
