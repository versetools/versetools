import { logger } from "@l3dev/logger";
import { NONE, ok, Result } from "@l3dev/result";
import type { InteropServiceName } from "@versetools/interop";
import * as bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import { uploadapi } from "$server/uploads";

import {
	db,
	tables,
	type DbDataRequest,
	type DbDataRequestWithEmailVerificationTokens
} from "../db";
import { sendVerifyEmail, sendVerifyEmailOrReminder } from "./email-verification";
import { DataRequestPartyType, DataRequestStatus, type DataRequestType } from "./request-types";

export * from "./email-verification";
export * from "./request-types";

const ARCHIVE_AFTER = 1000 * 60 * 60 * 24 * 365;
const ARCHIVE_SALT_ROUNDS = 12;

export async function getDataRequest(id: DbDataRequest["id"]) {
	const result = await db.safeExecute(
		"QUERY_DATA_REQUEST",
		db.query.dataRequests.findFirst({ where: (t, { eq }) => eq(t.id, id) })
	);
	if (!result.ok) {
		return result;
	}

	return ok(result.value as DbDataRequest | undefined);
}

export async function getUnverifiedDataRequests() {
	const result = await db.safeExecute(
		"QUERY_UNVERIFIED_DATA_REQUESTS",
		db.query.dataRequests.findMany({
			where: (t, { or, and, isNull, isNotNull }) =>
				or(
					and(isNull(t.subjectEmailVerifiedAt), isNull(t.subjectVerifyReminderSent)),
					and(
						isNotNull(t.thirdPartyEmail),
						isNull(t.thirdPartyEmailVerifiedAt),
						isNull(t.thirdPartyVerifyReminderSent)
					)
				),
			with: {
				emailVerificationTokens: true
			}
		})
	);

	if (!result.ok) {
		return result;
	}

	return ok(result.value as DbDataRequestWithEmailVerificationTokens[]);
}

export async function getArchiveableDataRequests() {
	const result = await db.safeExecute(
		"QUERY_ARCHIVEABLE_DATA_REQUESTS",
		db.query.dataRequests.findMany({
			where: (t, { and, inArray, lt, isNull }) =>
				and(
					inArray(t.status, [DataRequestStatus.Completed, DataRequestStatus.Denied]),
					lt(t.closedAt, new Date(Date.now() - ARCHIVE_AFTER)),
					isNull(t.archivedAt)
				)
		})
	);

	if (!result.ok) {
		return result;
	}

	return ok(result.value as DbDataRequestWithEmailVerificationTokens[]);
}

export async function hasActiveDataRequest(type: DataRequestType, subjectEmail: string) {
	const result = await db.safeExecute(
		"QUERY_ACTIVE_DATA_REQUEST",
		db.query.dataRequests.findFirst({
			where: (t, { and, eq, notInArray }) =>
				and(
					eq(t.type, type),
					eq(t.subjectEmail, subjectEmail),
					notInArray(t.status, [DataRequestStatus.Denied, DataRequestStatus.Completed])
				)
		})
	);

	if (!result.ok) {
		return result;
	}
	return ok(!!result.value);
}

type CreateDataRequestData =
	| {
			type: DataRequestType.Export;
			subjectFirstName: string;
			subjectLastName: string;
			subjectEmail: string;
			thirdPartyFirstName?: string | null;
			thirdPartyLastName?: string | null;
			thirdPartyEmail?: string | null;
			services?: InteropServiceName[] | null;
			additionalComments?: string | null;
	  }
	| {
			type: DataRequestType.Delete;
			subjectFirstName: string;
			subjectLastName: string;
			subjectEmail: string;
			thirdPartyFirstName?: string | null;
			thirdPartyLastName?: string | null;
			thirdPartyEmail?: string | null;
			additionalComments?: string | null;
	  }
	| {
			type: DataRequestType.Restrict;
			subjectFirstName: string;
			subjectLastName: string;
			subjectEmail: string;
			thirdPartyFirstName?: string | null;
			thirdPartyLastName?: string | null;
			thirdPartyEmail?: string | null;
			additionalComments?: string | null;
	  }
	| {
			type: DataRequestType.Update;
			subjectFirstName: string;
			subjectLastName: string;
			subjectEmail: string;
			thirdPartyFirstName?: string | null;
			thirdPartyLastName?: string | null;
			thirdPartyEmail?: string | null;
			inaccuracies: string;
			additionalComments?: string | null;
	  };

export async function createDataRequest(data: CreateDataRequestData) {
	const insertResult = await db.safeExecute(
		"CREATE_DATA_REQUEST",
		db
			.insert(tables.dataRequests)
			.values({
				status: DataRequestStatus.AwaitingVerification,
				services: null,
				...data
			})
			.returning()
	);

	if (!insertResult.ok) {
		return insertResult;
	}

	const request = insertResult.value[0] as DbDataRequest;
	const promises = [sendVerifyEmail(request, DataRequestPartyType.Subject)];

	if (data.thirdPartyEmail) {
		promises.push(sendVerifyEmail(request, DataRequestPartyType.ThirdParty));
	}

	const emailResults = await Result.allSettledAsync(...promises);

	const errors = Result.allErrors(...emailResults);
	if (errors.length > 0) {
		logger.error("Failed to send data request email(s)", errors);
	}

	return ok(request);
}

export async function sendDataRequestVerifyEmails(
	request: DbDataRequestWithEmailVerificationTokens
) {
	const promises = [];

	if (!request.subjectEmailVerifiedAt && !request.subjectVerifyReminderSent) {
		promises.push(sendVerifyEmailOrReminder(request, DataRequestPartyType.Subject));
	}

	if (
		request.thirdPartyEmail &&
		!request.thirdPartyEmailVerifiedAt &&
		!request.thirdPartyVerifyReminderSent
	) {
		promises.push(sendVerifyEmailOrReminder(request, DataRequestPartyType.ThirdParty));
	}

	const emailResults = await Result.allSettledAsync(...promises);

	const errors = Result.allErrors(...emailResults);
	if (errors.length > 0) {
		logger.error("Failed to send data request email reminders", errors);
	}

	return NONE;
}

export function archiveDataRequest(request: DbDataRequest) {
	return db.safeTransaction("ARCHIVE_DATA_REQUEST", async (tx) => {
		const subjectEmailHash = await bcrypt.hash(request.subjectEmail, ARCHIVE_SALT_ROUNDS);
		const thirdPartyEmailHash = request.thirdPartyEmail
			? await bcrypt.hash(request.thirdPartyEmail, ARCHIVE_SALT_ROUNDS)
			: null;

		if (request.thirdPartyConsentFileKey) {
			await uploadapi.deleteFiles(request.thirdPartyConsentFileKey);
		}

		await tx
			.update(tables.dataRequests)
			.set({
				archivedAt: new Date(),
				subjectFirstName: "REDACTED",
				subjectLastName: "REDACTED",
				subjectEmail: subjectEmailHash,
				thirdPartyFirstName: request.thirdPartyFirstName ? "REDACTED" : null,
				thirdPartyLastName: request.thirdPartyLastName ? "REDACTED" : null,
				thirdPartyEmail: thirdPartyEmailHash,
				thirdPartyConsentFileKey: null,
				inaccuracies: request.inaccuracies ? "REDACTED" : null,
				collectedData: null
			})
			.where(eq(tables.dataRequests.id, request.id))
			.execute();
	});
}
