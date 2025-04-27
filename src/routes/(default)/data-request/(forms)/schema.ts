import { z } from "zod";

export const DataRequestSchema = z.object({
	thirdParty: z
		.object({
			firstName: z.string().min(1, "First name is required"),
			lastName: z.string().min(1, "Last name is required"),
			email: z.string().email()
		})
		.nullable(),
	dataSubject: z.object({
		firstName: z.string().min(1, "First name is required"),
		lastName: z.string().min(1, "Last name is required"),
		email: z.string().email()
	}),
	additionalComments: z.string().nullable()
});
