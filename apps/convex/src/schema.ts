import { defineSchema } from "convex/server";

import { schema } from "$convex/app/schema";

export default defineSchema(schema, {
	strictTableNameTypes: true
});
