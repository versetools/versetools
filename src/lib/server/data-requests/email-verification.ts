import { ok, Result } from "@versetools/result";
import { eq } from "drizzle-orm";

import { dev } from "$app/environment";
import { config } from "$lib/config";
import { db, tables, type DbDataRequest } from "$server/db";

import { DataRequestPartyType } from "./request-types";

export async function generateEmailVerificationUrl(
	request: DbDataRequest | { id: DbDataRequest["id"] },
	partyType: DataRequestPartyType
) {
	const insertTokenResult = await Result.fromPromise(
		{ onError: { type: "DATA_REQUEST_EMAIL_VERIFICATION_TOKEN_CREATE_FAILED" } },
		db
			.insert(tables.dataRequestEmailVerificationTokens)
			.values({
				partyType,
				expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
				requestId: request.id
			})
			.returning()
			.execute()
	);

	if (!insertTokenResult.ok) {
		return insertTokenResult;
	}

	const token = insertTokenResult.value[0];

	return ok(
		`${dev ? "http://localhost:5173" : `https://${config.domain}`}/data-request/verification?token=${token.id}`
	);
}

export async function verifyEmailVerificationToken(tokenId: string) {
	const tokenResult = await Result.fromPromise(
		{ onError: { type: "DATA_REQUEST_EMAIL_VERIFICATION_TOKEN_QUERY_FAILED" } },
		db.query.dataRequestEmailVerificationTokens
			.findFirst({
				where: eq(tables.dataRequestEmailVerificationTokens.id, tokenId)
			})
			.execute()
	);

	if (!tokenResult.ok) {
		return tokenResult;
	}

	const token = tokenResult.value;
	if (!token) {
		return ok(false);
	}

	if (token.expiresAt < new Date()) {
		const deleteResult = await Result.fromPromise(
			{ onError: { type: "DATA_REQUEST_EMAIL_VERIFICATION_TOKEN_DELETE_FAILED" } },
			db
				.delete(tables.dataRequestEmailVerificationTokens)
				.where(eq(tables.dataRequestEmailVerificationTokens.id, tokenId))
				.execute()
		);
		if (!deleteResult.ok) {
			return deleteResult;
		}

		return ok(false);
	}

	const transactionResult = await Result.fromPromise(
		{ onError: { type: "DATA_REQUEST_EMAIL_VERIFICATION_FAILED" } },
		db.transaction(async (tx) => {
			if (token.partyType === DataRequestPartyType.ThirdParty) {
				await tx.update(tables.dataRequests).set({
					thirdPartyEmailVerified: true
				});
			} else {
				await tx.update(tables.dataRequests).set({
					subjectEmailVerified: true
				});
			}

			await tx
				.delete(tables.dataRequestEmailVerificationTokens)
				.where(eq(tables.dataRequestEmailVerificationTokens.id, tokenId))
				.execute();
		})
	);

	if (transactionResult.ok) {
		return transactionResult;
	}

	return ok(true);
}
