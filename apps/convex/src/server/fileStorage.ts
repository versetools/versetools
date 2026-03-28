import { v } from "convex/values";

import { internalAction } from "$convex/_generated/server";
import { fileStorage } from "$convex/app/main";

export const deleteFiles = internalAction({
	args: {
		keys: v.array(v.string())
	},
	handler: async (_ctx, args): Promise<void> => {
		await fileStorage.deleteFiles(args.keys);
	}
});
