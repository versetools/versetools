import { logger } from "@l3dev/logger";
import { err } from "@l3dev/result";

import { verifyEmailVerificationToken } from "$server/data-requests";

import type { PageServerLoad } from "./$types";

async function verifyToken(token: string) {
	const result = await verifyEmailVerificationToken(token);
	if (!result.ok) {
		logger.error("Failed to verify token", result);
		return err(result.type);
	}
	return result;
}

export const load = (async ({ url }) => {
	const token = url.searchParams.get("token");

	return {
		tokenResult: token ? verifyToken(token) : Promise.resolve(err("MISSING_TOKEN"))
	};
}) satisfies PageServerLoad;
