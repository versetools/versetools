import { cuid2 } from "drizzle-cuid2/postgres";
import { relations, type InferSelectModel } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import type { DataRequestPartyType, DataRequestStatus, DataRequestType } from "../../data-requests";

export type DbDataRequest = Omit<InferSelectModel<typeof dataRequests>, "type" | "status"> & {
	type: DataRequestType;
	status: DataRequestStatus;
};

export const dataRequests = pgTable("data_requests", {
	id: cuid2("id").primaryKey().defaultRandom(),

	type: text("type").notNull(),
	status: text("status").notNull(),
	reason: text("reason"),

	subjectFirstName: text("subject_first_name").notNull(),
	subjectLastName: text("subject_last_name").notNull(),
	subjectEmail: text("subject_email").notNull(),
	subjectEmailVerified: boolean("subject_email_verified").notNull().default(false),

	thirdPartyFirstName: text("third_party_first_name"),
	thirdPartyLastName: text("third_party_last_name"),
	thirdPartyEmail: text("third_party_email"),
	thirdPartyEmailVerified: boolean("third_party_email_verified").notNull().default(false),
	thirdPartyConsentFileKey: text("third_party_consent_file_key"),

	additionalComments: text("additional_comments"),

	allProducts: boolean("all_products"),
	products: text("products").array().notNull().default([]),

	inaccuracies: text("inaccuracies"),

	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdateFn(() => new Date()),
	createdAt: timestamp("created_at").notNull().defaultNow()
});

export const dataRequestsRelations = relations(dataRequests, ({ many }) => ({
	emailVerificationTokens: many(dataRequestEmailVerificationTokens)
}));

export type DbDataRequestEmailVerificationToken = Omit<
	InferSelectModel<typeof dataRequestEmailVerificationTokens>,
	"partyType"
> & {
	partyType: DataRequestPartyType;
};

export const dataRequestEmailVerificationTokens = pgTable(
	"data_request_email_verification_tokens",
	{
		id: cuid2("id").primaryKey().defaultRandom(),
		partyType: text("party_type").notNull(),

		expiresAt: timestamp("expires_at").notNull(),
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
