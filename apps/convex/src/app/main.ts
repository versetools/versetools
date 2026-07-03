import { createCoreModule } from "@versetools/core/config/module";
import { convexRouter } from "@versetools/core/routers";
import { createContainer, createFactory, createModule } from "haywire";

import type { DataModel } from "$convex/_generated/dataModel";

import { sesClientBinding } from "./config/aws";
import { envModule } from "./config/env";
import { rsiLauncherAuthenticationServiceBinding } from "./config/rsi";
import { subscriptionRegistryBinding } from "./config/subscriptions";

const appModule = createModule(subscriptionRegistryBinding)
	.addBinding(rsiLauncherAuthenticationServiceBinding)
	.addBinding(sesClientBinding);

const module = appModule
	.mergeModule(
		createCoreModule({
			email: {
				providers: {
					send: "ses",
					receive: "sqs"
				}
			},
			fileStorage: "uploadthing"
		})
	)
	.mergeModule(envModule);

export const containerFactory = createFactory(module);

void createContainer(module);

export const router = convexRouter<DataModel>(containerFactory);
