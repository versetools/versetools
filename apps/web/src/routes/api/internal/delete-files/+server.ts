import { error, json } from "@sveltejs/kit";
import * as z from "zod/v4";

import { logger } from "$server/logger";
import { uploadAPI } from "$server/uploads";

import type { RequestHandler } from "./$types";

const InputSchema = z.object({
	keys: z.array(z.string())
});

export const POST: RequestHandler = async (event) => {
	const { success, data, error: zodError } = InputSchema.safeParse(await event.request.json());
	if (!success) {
		error(400, {
			message: "Invalid body",
			type: "BAD_REQUEST",
			zodError
		});
	}

	try {
		const result = await uploadAPI.deleteFiles(data.keys);
		return json(result, {
			status: 200
		});
	} catch (err) {
		logger.error("Failed to delete files", { keys: data.keys, error: err });
		error(500, {
			message: "Failed to delete files",
			type: "INTERNAL_SERVER_ERROR"
		});
	}
};
