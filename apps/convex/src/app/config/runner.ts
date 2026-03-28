import { Runner, SubscriptionRegistry } from "@versetools/core/commands";

import type { DataModel } from "$convex/_generated/dataModel";

export const subscriptionRegistry = new SubscriptionRegistry<DataModel>();
export const runner = new Runner<DataModel>(subscriptionRegistry);
