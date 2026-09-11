import { v } from "convex/values";

import { router } from "$convex/app/main";
import FileStorageService from "@versetools/core/services/files/FileStorageService";

export const deleteFiles = router
	.internalAction({
		args: {
			keys: v.array(v.string())
		}
	})
	.withDependencies(({ argsId }) => [FileStorageService, argsId])
	.withHandler(async (fileStorage, args): Promise<void> => {
		await fileStorage.deleteFiles(args.keys);
	});
