import { eq } from "drizzle-orm";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";

import { db, tables } from "$server/db";

import { getDataRequest } from "../../data-requests";
import { uploadthing } from "../builder";
import { uploadapi } from "../client";

const InputSchema = z.object({ requestId: z.string().cuid2("Request ID is required") });

export const dataRequestEvidenceRoute = uploadthing(
	{
		image: {
			maxFileSize: "4MB",
			maxFileCount: 1,
			acl: "public-read"
		},
		"application/pdf": {
			maxFileSize: "4MB",
			maxFileCount: 1,
			acl: "public-read",
			contentDisposition: "attachment"
		},
		"application/msword": {
			maxFileSize: "4MB",
			maxFileCount: 1,
			acl: "public-read",
			contentDisposition: "attachment"
		},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
			maxFileSize: "4MB",
			maxFileCount: 1,
			acl: "public-read",
			contentDisposition: "attachment"
		}
	},
	{ awaitServerData: true }
)
	.input(InputSchema)
	.middleware(async ({ input, files }) => {
		if (files.length !== 1) {
			throw new UploadThingError({
				code: "BAD_REQUEST",
				message: "Only one file is allowed"
			});
		}

		const dataRequestResult = await getDataRequest(input.requestId);
		if (!dataRequestResult.ok) {
			throw new UploadThingError({
				code: "INTERNAL_SERVER_ERROR",
				cause: dataRequestResult.type
			});
		}

		const dataRequest = dataRequestResult.value;
		if (!dataRequest) {
			throw new UploadThingError({
				code: "NOT_FOUND",
				message: "Data request not found"
			});
		}

		if (dataRequest.thirdPartyConsentFileKey || !dataRequest.thirdPartyEmail) {
			throw new UploadThingError({
				code: "FORBIDDEN"
			});
		}

		return {
			dataRequest
		};
	})
	.onUploadComplete(async ({ metadata, file }) => {
		const updateResult = await db.safeExecute(
			"UPDATE_DATA_REQUEST_WITH_CONSENT_FILE",
			db
				.update(tables.dataRequests)
				.set({ thirdPartyConsentFileKey: file.key })
				.where(eq(tables.dataRequests.id, metadata.dataRequest.id))
		);

		if (!updateResult.ok) {
			await uploadapi.deleteFiles(file.key);
			throw new UploadThingError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to persist upload"
			});
		}
	});
