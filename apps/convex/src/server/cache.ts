import { ActionCache } from "@versetools/core/services/cache/ActionCache";

import { router } from "$convex/app/main";

export const { get, put, remove, removeAll, purge } = ActionCache.createRoutes(router);
