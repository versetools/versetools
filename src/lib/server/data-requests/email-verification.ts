import { err, NONE, ok, Result } from "@l3dev/result";
import { InteropServiceNames } from "@versetools/interop";
import { eq } from "drizzle-orm";

import { dev } from "$app/environment";
import { config } from "$lib/config";
import { interopBus } from "$server/bus";
import {
	db,
	tables,
	type DbDataRequest,
	type DbDataRequestEmailVerificationToken,
	type DbDataRequestWithEmailVerificationTokens
} from "$server/db";
import { sendEmail, templates } from "$server/email";

import { DataRequestPartyType, DataRequestStatus } from "./request-types";

export function getEmailVerificationUrl(
	token: DbDataRequestEmailVerificationToken | { id: DbDataRequestEmailVerificationToken["id"] }
) {
	return `${dev ? "http://localhost:5173" : `https://${config.domain}`}/data-request/verification?token=${token.id}`;
}

export async function generateEmailVerificationUrl(
	request: DbDataRequest | { id: DbDataRequest["id"] },
	partyType: DataRequestPartyType
) {
	const insertTokenResult = await db.safeExecute(
		"CREATE_DATA_REQUEST_EMAIL_TOKEN",
		db
			.insert(tables.dataRequestEmailVerificationTokens)
			.values({
				partyType,
				requestId: request.id
			})
			.returning()
	);

	if (!insertTokenResult.ok) {
		return insertTokenResult;
	}

	const token = insertTokenResult.value[0];
	return ok(getEmailVerificationUrl(token));
}

export async function verifyEmailVerificationToken(tokenId: string) {
	const tokenResult = await db.safeExecute(
		"QUERY_DATA_REQUEST_EMAIL_TOKEN",
		db.query.dataRequestEmailVerificationTokens.findFirst({
			where: (t, { eq }) => eq(t.id, tokenId),
			with: {
				request: true
			}
		})
	);
	if (!tokenResult.ok) {
		return tokenResult;
	}

	const token = tokenResult.value;
	if (!token) {
		return ok(false);
	}

	const request = token.request as DbDataRequest;

	const transactionResult = await db.safeTransaction("VERIFY_DATA_REQUEST_EMAIL", async (tx) => {
		const startProcessing =
			(token.partyType === DataRequestPartyType.Subject &&
				(!request.thirdPartyEmail || request.thirdPartyEmailVerifiedAt)) ||
			(token.partyType === DataRequestPartyType.ThirdParty && request.subjectEmailVerifiedAt);

		await tx
			.update(tables.dataRequests)
			.set(
				token.partyType === DataRequestPartyType.ThirdParty
					? {
							status: startProcessing ? DataRequestStatus.Processing : undefined,
							thirdPartyEmailVerifiedAt: new Date()
						}
					: {
							status: startProcessing ? DataRequestStatus.Processing : undefined,
							subjectEmailVerifiedAt: new Date()
						}
			)
			.where(eq(tables.dataRequests.id, token.requestId))
			.execute();

		await tx
			.delete(tables.dataRequestEmailVerificationTokens)
			.where(eq(tables.dataRequestEmailVerificationTokens.id, tokenId))
			.execute();

		if (startProcessing) {
			await interopBus.startDataRequestJob(
				{
					id: token.requestId,
					type: request.type,
					subject: {
						firstName: request.subjectFirstName,
						lastName: request.subjectLastName,
						email: request.subjectEmail
					}
				},
				request.services?.length ? request.services : InteropServiceNames
			);
		}
	});

	if (!transactionResult.ok) {
		return transactionResult;
	}

	return ok(true);
}

export const sendVerifyEmail = Result.pipeAsync(
	async (request: DbDataRequest, partyType: DataRequestPartyType) => {
		const result = await generateEmailVerificationUrl(request, partyType);
		if (!result.ok) return result;
		return ok({
			request,
			partyType,
			verificationUrl: result.value
		});
	},
	async ({ request, partyType, verificationUrl }) => {
		const to =
			partyType === DataRequestPartyType.Subject ? request.subjectEmail : request.thirdPartyEmail;
		if (!to) return NONE;

		return await sendEmail({
			from: "datarequest",
			fromDisplayName: `${config.name} Privacy`,
			to,
			template: templates.dataRequestVerify({
				version: partyType,
				verificationUrl
			})
		});
	}
);

export const sendVerifyReminderEmail = Result.pipeAsync(
	async (request: DbDataRequestWithEmailVerificationTokens, partyType: DataRequestPartyType) => {
		const token = request.emailVerificationTokens.find((token) => token.partyType === partyType);
		if (!token) return err("MISSING_VERIFY_TOKEN");

		const tokenAge = Date.now() - token.createdAt.getTime();
		if (tokenAge < 1000 * 60 * 60 * 24) {
			return err("VERIFY_TOKEN_TOO_YOUNG");
		}

		return ok({
			request,
			partyType,
			verificationUrl: getEmailVerificationUrl(token)
		});
	},
	async ({ request, partyType, verificationUrl }) => {
		const to =
			partyType === DataRequestPartyType.Subject ? request.subjectEmail : request.thirdPartyEmail;
		if (!to) return NONE;

		return await db.safeTransaction("SEND_DATA_REQUEST_VERIFY_REMINDER", async (tx) => {
			if (partyType === DataRequestPartyType.Subject) {
				await tx
					.update(tables.dataRequests)
					.set({
						subjectVerifyReminderSent: new Date()
					})
					.where(eq(tables.dataRequests.id, request.id))
					.execute();
			} else {
				await tx
					.update(tables.dataRequests)
					.set({
						thirdPartyVerifyReminderSent: new Date()
					})
					.where(eq(tables.dataRequests.id, request.id))
					.execute();
			}

			const sendEmailResult = await sendEmail({
				from: "datarequest",
				fromDisplayName: `${config.name} Privacy`,
				to,
				template: templates.dataRequestVerifyReminder({
					version: partyType,
					verificationUrl
				})
			});
			if (!sendEmailResult.ok) {
				tx.rollback();
				return sendEmailResult;
			}

			return sendEmailResult;
		});
	}
);

export const sendVerifyEmailOrReminder = Result.fn(async function (
	request: DbDataRequestWithEmailVerificationTokens,
	partyType: DataRequestPartyType
) {
	const reminderSent =
		partyType === DataRequestPartyType.Subject
			? request.subjectVerifyReminderSent
			: request.thirdPartyVerifyReminderSent;
	if (reminderSent) {
		return NONE;
	}

	const sendReminderResult = await sendVerifyReminderEmail(request, partyType);
	if (sendReminderResult.ok) {
		return sendReminderResult;
	}

	if (sendReminderResult.type === "VERIFY_TOKEN_TOO_YOUNG") {
		return NONE;
	}

	if (sendReminderResult.type === "MISSING_VERIFY_TOKEN") {
		return await sendVerifyEmail(request, partyType);
	}

	return sendReminderResult;
});
