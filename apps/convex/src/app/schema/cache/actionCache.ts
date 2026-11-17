import { ActionCache } from "@versetools/core/services/cache/ActionCache";

import type { Doc } from "$convex/_generated/dataModel";

export type CachedActionValue = Doc<"cachedActionValues">;
export type CachedActionMetadata = Doc<"cachedActionMetadata">;

export const actionCacheSchema = ActionCache.schema;
