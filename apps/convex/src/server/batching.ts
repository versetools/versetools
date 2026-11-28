import { BatchingService } from "@versetools/core/services/BatchingService";

import { router } from "$convex/app/main";

export const { batchDeleteRefs, batchDeleteRows } = BatchingService.createRoutes(router);
