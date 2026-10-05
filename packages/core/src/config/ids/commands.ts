import { identifier } from "haywire";

import type { Subscription } from "../../commands";
import type { RunnerService } from "../../services/commands/RunnerService";
import type { SubscriptionRegistry } from "../../services/commands/subscriptions/SubscriptionRegistry";

export const genericRunnerServiceId = identifier<RunnerService<any>>().named("runnerService");
export const genericSubscriptionRegistryId =
	identifier<SubscriptionRegistry<any>>().named("subscriptionRegistry");

export const subscriptionTag = identifier<Subscription<any, any>>().list().named("subscriptions");
