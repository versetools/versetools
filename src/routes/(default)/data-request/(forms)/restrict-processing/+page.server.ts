import { fail, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";

import { hasActiveDataRequest } from "$lib/server/data-requests";
import { createDataRequest, DataRequestType } from "$lib/server/data-requests";

import type { Actions, PageServerLoad } from "./$types";
import { RestrictProcessingRequestSchema } from "./schema";

export const load = (async () => {
	return {
		form: await superValidate(zod(RestrictProcessingRequestSchema))
	};
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod(RestrictProcessingRequestSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const activeRequestResult = await hasActiveDataRequest(
			DataRequestType.Restrict,
			form.data.dataSubject.email
		);
		if (!activeRequestResult.ok) {
			return fail(500, { form, type: activeRequestResult.type });
		}

		if (activeRequestResult.value) {
			return fail(409, { form });
		}

		const result = await createDataRequest({
			type: DataRequestType.Restrict,
			subjectFirstName: form.data.dataSubject.firstName,
			subjectLastName: form.data.dataSubject.lastName,
			subjectEmail: form.data.dataSubject.email,
			thirdPartyFirstName: form.data.thirdParty?.firstName,
			thirdPartyLastName: form.data.thirdParty?.lastName,
			thirdPartyEmail: form.data.thirdParty?.email,
			additionalComments: form.data.additionalComments
		});

		if (!result.ok) {
			return fail(500, { form, type: result.type });
		}

		return { form };
	}
} satisfies Actions;
