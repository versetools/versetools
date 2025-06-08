import { db } from "../db";

export function getAdminUser(id: string) {
	return db.safeExecute(
		"ADMIN_ID_QUERY",
		db.query.adminUsers.findFirst({ where: (t, { eq }) => eq(t.id, id) })
	);
}

export function getAdminUserByEmail(email: string) {
	return db.safeExecute(
		"ADMIN_EMAIL_QUERY",
		db.query.adminUsers.findFirst({ where: (t, { eq }) => eq(t.email, email) })
	);
}
