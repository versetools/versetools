import { fail, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";

import {
	createDataRequest,
	hasActiveDataRequest,
	DataRequestType
} from "$lib/server/data-requests";

import type { Actions, PageServerLoad } from "./$types";
import { CorrectInaccuraciesRequestSchema } from "./schema";

export const load = (async () => {
	return {
		form: await superValidate(zod(CorrectInaccuraciesRequestSchema))
	};
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod(CorrectInaccuraciesRequestSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const activeRequestResult = await hasActiveDataRequest(
			DataRequestType.Update,
			form.data.dataSubject.email
		);
		if (!activeRequestResult.ok) {
			return fail(500, { form, type: activeRequestResult.type });
		}

		if (activeRequestResult.value) {
			return fail(409, { form });
		}

		const result = await createDataRequest({
			type: DataRequestType.Update,
			subjectFirstName: form.data.dataSubject.firstName,
			subjectLastName: form.data.dataSubject.lastName,
			subjectEmail: form.data.dataSubject.email,
			thirdPartyFirstName: form.data.thirdParty?.firstName,
			thirdPartyLastName: form.data.thirdParty?.lastName,
			thirdPartyEmail: form.data.thirdParty?.email,
			inaccuracies: form.data.inaccuracies,
			additionalComments: form.data.additionalComments
		});

		if (!result.ok) {
			return fail(500, { form, type: result.type });
		}

		return { form };
	}
} satisfies Actions;
