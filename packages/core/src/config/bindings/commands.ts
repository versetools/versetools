import { bind, singletonScope } from "haywire";

import { RunnerService } from "../../services/commands/RunnerService";
import { runnerServiceId, subscriptionRegistryId } from "../ids/commands";

export const runnerServiceBinding = bind(runnerServiceId)
	.withDependencies([subscriptionRegistryId])
	.withProvider((registry) => new RunnerService(registry))
	.scoped(singletonScope);
