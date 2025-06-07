import { db, safeExecute } from "../db";

export function getAdminUser(id: string) {
	return safeExecute(
		"ADMIN_ID_QUERY",
		db.query.adminUsers.findFirst({ where: (t, { eq }) => eq(t.id, id) })
	);
}

export function getAdminUserByEmail(email: string) {
	return safeExecute(
		"ADMIN_EMAIL_QUERY",
		db.query.adminUsers.findFirst({ where: (t, { eq }) => eq(t.email, email) })
	);
}
