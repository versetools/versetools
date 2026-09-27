import * as z from "zod";

export const DataRequestSchema = z.object({
	thirdParty: z
		.object({
			firstName: z.string().trim().min(1, "First name is required"),
			lastName: z.string().trim().min(1, "Last name is required"),
			email: z.email()
		})
		.nullable(),
	dataSubject: z.object({
		firstName: z.string().trim().min(1, "First name is required"),
		lastName: z.string().trim().min(1, "Last name is required"),
		email: z.email()
	}),
	additionalComments: z.string().trim().nullable()
});
