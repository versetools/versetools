import { batchingApiId } from "@versetools/core/config/ids/batching";
import { bind } from "haywire";

import { internal } from "$convex/_generated/api";

export const batchingApiBinding = bind(batchingApiId).withInstance(internal.server.batching);
