import { Result } from "@versetools/result";
import { eq } from "drizzle-orm";

import { db, tables } from "../db";

export function getAdminUser(id: string) {
	return Result.fromPromise(
		{ onError: { type: "USER_QUERY_FAILED" } },
		db.query.adminUsers.findFirst({ where: eq(tables.adminUsers.id, id) }).execute()
	);
}

export function getAdminUserByEmail(email: string) {
	return Result.fromPromise(
		{ onError: { type: "USER_QUERY_FAILED" } },
		db.query.adminUsers.findFirst({ where: eq(tables.adminUsers.email, email) }).execute()
	);
}
