import { subscriptionRegistryId } from "@versetools/core/config/ids/commands";
import { SubscriptionRegistry } from "@versetools/core/services/commands/subscriptions/SubscriptionRegistry";
import { bind, optimisticSingletonScope } from "haywire";

import type { DataModel } from "$convex/_generated/dataModel";

export const subscriptionRegistryBinding = bind(subscriptionRegistryId)
	.withGenerator(() => {
		const registry = new SubscriptionRegistry<DataModel>();

		// register subscriptions here

		return registry;
	})
	.scoped(optimisticSingletonScope);
