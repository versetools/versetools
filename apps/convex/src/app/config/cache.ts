import { actionCacheApiId } from "@versetools/core/config/ids/cache";
import { bind } from "haywire";

import { internal } from "$convex/_generated/api";

export const actionCacheApiBinding = bind(actionCacheApiId).withInstance(internal.server.cache);
