import type { InteropServiceName } from "@versetools/interop";
import { cuid2 } from "drizzle-cuid2/postgres";
import { relations, type InferSelectModel } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import type { DataRequestPartyType, DataRequestStatus, DataRequestType } from "../../data-requests";

export type DbDataRequest = InferSelectModel<typeof dataRequests>;
export type DbDataRequestWithEmailVerificationTokens = DbDataRequest & {
	emailVerificationTokens: DbDataRequestEmailVerificationToken[];
};

export const dataRequests = pgTable("data_requests", {
	id: cuid2("id").primaryKey().defaultRandom(),

	type: text("type").notNull().$type<DataRequestType>(),
	status: text("status").notNull().$type<DataRequestStatus>(),
	reason: text("reason"),

	subjectFirstName: text("subject_first_name").notNull(),
	subjectLastName: text("subject_last_name").notNull(),
	subjectEmail: text("subject_email").notNull(),
	subjectEmailVerifiedAt: timestamp("subject_email_verified_at"),
	subjectVerifyReminderSent: timestamp("subject_verify_reminder_sent"),

	thirdPartyFirstName: text("third_party_first_name"),
	thirdPartyLastName: text("third_party_last_name"),
	thirdPartyEmail: text("third_party_email"),
	thirdPartyEmailVerifiedAt: timestamp("third_party_email_verified_at"),
	thirdPartyVerifyReminderSent: timestamp("third_party_verify_reminder_sent"),
	thirdPartyConsentFileKey: text("third_party_consent_file_key"),

	additionalComments: text("additional_comments"),

	services: text("services").array().$type<InteropServiceName[]>(),

	inaccuracies: text("inaccuracies"),

	collectedData: jsonb("collected_data"),

	closedAt: timestamp("closed_at"),
	archivedAt: timestamp("archived_at"),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdateFn(() => new Date()),
	createdAt: timestamp("created_at").notNull().defaultNow()
});

export const dataRequestsRelations = relations(dataRequests, ({ many }) => ({
	emailVerificationTokens: many(dataRequestEmailVerificationTokens)
}));

export type DbDataRequestEmailVerificationToken = InferSelectModel<
	typeof dataRequestEmailVerificationTokens
>;

export const dataRequestEmailVerificationTokens = pgTable(
	"data_request_email_verification_tokens",
	{
		id: cuid2("id").primaryKey().defaultRandom(),
		partyType: text("party_type").notNull().$type<DataRequestPartyType>(),

		createdAt: timestamp("created_at").notNull().defaultNow(),

		requestId: cuid2("request_id")
			.notNull()
			.references(() => dataRequests.id, { onDelete: "cascade" })
	}
);

export const dataRequestEmailVerificationTokensRelations = relations(
	dataRequestEmailVerificationTokens,
	({ one }) => ({
		request: one(dataRequests, {
			fields: [dataRequestEmailVerificationTokens.requestId],
			references: [dataRequests.id]
		})
	})
);

export const dataRequestTables = {
	dataRequests,
	dataRequestEmailVerificationTokens
};
