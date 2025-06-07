import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";

import { createDataRequest, DataRequestType } from "$lib/server/data-requests";

import type { Actions, PageServerLoad } from "./$types";
import { DownloadRequestSchema } from "./schema";
import { handleDataRequestForm } from "../handler.server";

export const load = (async () => {
	return {
		form: await superValidate(zod(DownloadRequestSchema))
	};
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod(DownloadRequestSchema));

		return await handleDataRequestForm(DataRequestType.Export, form, (type, form) => {
			return createDataRequest({
				type,
				subjectFirstName: form.data.dataSubject.firstName,
				subjectLastName: form.data.dataSubject.lastName,
				subjectEmail: form.data.dataSubject.email,
				thirdPartyFirstName: form.data.thirdParty?.firstName,
				thirdPartyLastName: form.data.thirdParty?.lastName,
				thirdPartyEmail: form.data.thirdParty?.email,
				allProducts: form.data.allProducts ?? false,
				products: form.data.products,
				additionalComments: form.data.additionalComments
			});
		});
	}
} satisfies Actions;
