import { bind, requestScope, eagerSingletonScope } from "haywire";

import { genericCtxId } from "../../routers";
import { RunnerService } from "../../services/commands/RunnerService";
import { SubscriptionRegistry } from "../../services/commands/subscriptions/SubscriptionRegistry";
import {
	genericRunnerServiceId,
	genericSubscriptionRegistryId,
	subscriptionTag
} from "../ids/commands";

export const runnerServiceBinding = bind(genericRunnerServiceId)
	.withDependencies([genericCtxId, genericSubscriptionRegistryId])
	.withProvider((ctx, registry) => new RunnerService(ctx, registry))
	.scoped(requestScope);

export const subscriptionRegistryBinding = bind(genericSubscriptionRegistryId)
	.withDependencies([subscriptionTag])
	.withProvider((subscriptions) => new SubscriptionRegistry().register(subscriptions))
	.scoped(eagerSingletonScope);
