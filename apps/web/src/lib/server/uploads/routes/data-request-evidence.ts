import { api } from "$convex/_generated/api";
import { UploadThingError } from "uploadthing/server";

import { db } from "$lib/convex/server";
import { logger } from "$server/logger";

import { uploadthing } from "../builder";
import { uploadAPI } from "../client";
import { assertAuthenticated } from "./helpers";

export default uploadthing(
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
	.middleware(async ({ req, files }) => {
		if (files.length !== 1) {
			throw new UploadThingError({
				code: "BAD_REQUEST",
				message: "Only one file is allowed"
			});
		}

		return {
			
		};
	})
	.onUploadComplete(async ({ metadata, file }) => {
		// const result = await db.safeMutation(api.users.users.secretSetAvatar, {
		// 	secret: db.secret,
		// 	key: file.key,
		// 	sizeBytes: file.size,
		// 	uploaderId: metadata.userId,
		// 	userId: metadata.userId
		// });

		// if (!result.ok) {
		// 	logger.error("Failed to upload user avatar", { metadata, error: result });
		// 	await uploadAPI.deleteFiles(file.key);
		// 	throw new UploadThingError({
		// 		code: "INTERNAL_SERVER_ERROR",
		// 		message: "Failed to persist upload"
		// 	});
		// }

		// return result.value;
	});
