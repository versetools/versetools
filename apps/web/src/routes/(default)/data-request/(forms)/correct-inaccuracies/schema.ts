import { z } from "zod";

import { DataRequestSchema } from "../schema";

export const CorrectInaccuraciesRequestSchema = DataRequestSchema.extend({
	inaccuracies: z.string().min(1, "Description of inaccuracies is required")
});
