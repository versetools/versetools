import { cuid2 } from "drizzle-cuid2/postgres";
import { relations, type InferSelectModel } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export type DbAdminUser = InferSelectModel<typeof adminUsers>;

export const adminUsers = pgTable("admin_users", {
	id: cuid2("id").primaryKey().defaultRandom(),

	email: text("email").notNull().unique(),
	permissions: text("permissions").array().notNull().default([]),

	discordId: text("discord_id"),
	discordUsername: text("discord_username"),

	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdateFn(() => new Date()),
	createdAt: timestamp("created_at").notNull().defaultNow()
});

export const adminUsersRelations = relations(adminUsers, ({ one, many }) => ({
	sessions: many(adminUsers)
}));

export type DbUserSession = Omit<InferSelectModel<typeof userSessions>, "data"> & {
	data: App.Session;
};

export const userSessions = pgTable("user_sessions", {
	key: text("key").primaryKey(),
	ip: text("ip"),
	geolocation: text("geolocation"),
	userAgent: text("user_agent"),

	data: jsonb("data"),

	expiresAt: timestamp("expires_at").notNull(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdateFn(() => new Date()),
	createdAt: timestamp("created_at").notNull().defaultNow(),

	userId: cuid2("user_id").references(() => adminUsers.id, { onDelete: "cascade" })
});

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
	user: one(adminUsers, {
		fields: [userSessions.userId],
		references: [adminUsers.id]
	})
}));

export const adminUserTables = {
	adminUsers,
	userSessions
};
