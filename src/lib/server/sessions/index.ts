import type { RequestEvent } from "@sveltejs/kit";
import { err, ok, Result } from "@versetools/result";
import { lt } from "drizzle-orm";

import { env } from "$env/dynamic/private";
import { getAdminUser } from "$server/admin";
import { db, tables } from "$server/db";

import { serverConfig } from "../config";
import { SessionImpl, type Session } from "./session";

export async function cleanupSessions() {
	const now = new Date();
	await db.delete(tables.userSessions).where(lt(tables.userSessions.expiresAt, now));
}

export const getSession = Result.fn(async function (event: RequestEvent) {
	const session = new SessionImpl(event, {
		secret: env.SESSION_SECRET,
		ttl: serverConfig.sessions.ttl,
		cookie: {
			name: serverConfig.sessions.cookie,
			httpOnly: true,
			secure: event.url.protocol === "https:",
			path: "/",
			sameSite: serverConfig.sessions.sameSite ?? "lax"
		}
	}) as Session;

	const initResult = await session.init();
	if (!initResult.ok) {
		return err("SESSION_INIT_FAILED", {
			error: initResult.context.error
		});
	}

	return ok(session);
});

export const getSessionAndUser = Result.fn(async function (event: RequestEvent) {
	const sessionResult = await getSession(event);
	if (!sessionResult.ok) {
		return sessionResult;
	}

	const session = sessionResult.value;
	const userResult = session.user ? await getAdminUser(session.user) : ok(null);
	if (!userResult.ok) {
		return userResult;
	}

	return ok({ session, user: userResult.value ?? null });
});
