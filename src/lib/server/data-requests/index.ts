import { NONE, ok, Result } from "@versetools/result";
import { and, eq, notInArray } from "drizzle-orm";

import { config } from "$lib/config";
import { sendEmail, templates } from "$server/email";
import { logger } from "$server/utils/logger";

import { db, tables, type DbDataRequest } from "../db";
import { generateEmailVerificationUrl } from "./email-verification";
import { DataRequestPartyType, DataRequestStatus, type DataRequestType } from "./request-types";

export * from "./email-verification";
export * from "./request-types";

export function getDataRequest(id: DbDataRequest["id"]) {
	return Result.fromPromise(
		{ onError: { type: "DATA_REQUEST_QUERY_FAILED" } },
		db.query.dataRequests.findFirst({ where: eq(tables.dataRequests.id, id) }).execute()
	);
}

export async function hasActiveDataRequest(type: DataRequestType, subjectEmail: string) {
	const result = await Result.fromPromise(
		{ onError: { type: "DATA_REQUEST_QUERY_FAILED" } },
		db.query.dataRequests
			.findFirst({
				where: and(
					eq(tables.dataRequests.type, type),
					eq(tables.dataRequests.subjectEmail, subjectEmail),
					notInArray(tables.dataRequests.status, [
						DataRequestStatus.Denied,
						DataRequestStatus.Completed
					])
				)
			})
			.execute()
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
			allProducts?: boolean;
			products?: string[];
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
	const insertResult = await Result.fromPromise(
		{ onError: { type: "DATA_REQUEST_CREATE_FAILED" } },
		db
			.insert(tables.dataRequests)
			.values({
				status: DataRequestStatus.AwaitingVerification,
				...data
			})
			.returning({
				id: tables.dataRequests.id
			})
			.execute()
	);

	if (!insertResult.ok) {
		return insertResult;
	}

	const request = insertResult.value[0];

	const emailSubject = Result.pipeAsync(
		() => generateEmailVerificationUrl(request, DataRequestPartyType.Subject),
		(subjectVerificationUrl) => {
			return sendEmail({
				from: "datarequest",
				fromDisplayName: `${config.name} Privacy`,
				to: data.subjectEmail,
				template: templates.dataRequestVerifyEmail({
					version: "subject",
					verificationLink: subjectVerificationUrl
				})
			});
		}
	);

	const emailThirdParty = Result.pipeAsync(
		() => generateEmailVerificationUrl(request, DataRequestPartyType.ThirdParty),
		async (subjectVerificationUrl) => {
			if (!data.thirdPartyEmail) {
				return NONE;
			}

			return await sendEmail({
				from: "datarequest",
				fromDisplayName: `${config.name} Privacy`,
				to: data.thirdPartyEmail,
				template: templates.dataRequestVerifyEmail({
					version: "third-party",
					verificationLink: subjectVerificationUrl
				})
			});
		}
	);

	const emailResults = await Result.allSettledAsync(
		emailSubject(),
		...(data.thirdPartyEmail ? [emailThirdParty()] : [])
	);

	const errors = Result.allErrors(...emailResults);
	if (errors.length > 0) {
		logger.error("Failed to send SAR email(s)", errors);
	}

	return ok(request);
}
