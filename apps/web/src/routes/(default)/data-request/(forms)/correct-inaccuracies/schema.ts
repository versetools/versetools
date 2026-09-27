import * as z from "zod";

import { DataRequestSchema } from "../schema";

export const CorrectInaccuraciesRequestSchema = DataRequestSchema.extend({
	inaccuracies: z.string().trim().min(1, "Description of inaccuracies is required")
});
