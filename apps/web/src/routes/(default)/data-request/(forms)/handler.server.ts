import { logger } from "@l3dev/logger";
import { fail, type SuperValidated } from "sveltekit-superforms";
import type { z } from "zod";

import {
	hasActiveDataRequest,
	type createDataRequest,
	type DataRequestType
} from "$server/data-requests";

import type { DataRequestSchema } from "./schema";

export async function handleDataRequestForm<
	TType extends DataRequestType,
	TData extends z.infer<typeof DataRequestSchema>
>(
	type: TType,
	form: SuperValidated<TData>,
	create: (type: TType, form: SuperValidated<TData>) => ReturnType<typeof createDataRequest>
) {
	if (!form.valid) {
		return fail(400, { form });
	}

	const activeRequestResult = await hasActiveDataRequest(type, form.data.dataSubject.email);
	if (!activeRequestResult.ok) {
		logger.error("Failed to check for active data request", activeRequestResult);
		return fail(500, { form, type: activeRequestResult.type });
	}

	if (activeRequestResult.value) {
		return fail(409, { form });
	}

	const result = await create(type, form);

	if (!result.ok) {
		logger.error("Failed to create data request", result);
		return fail(500, { form, type: result.type });
	}

	return { form, requestId: result.value.id };
}
