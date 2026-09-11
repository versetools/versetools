import { createCoreModule } from "@versetools/core/config/module";
import { convexRouter } from "@versetools/core/routers";
import { rsiLauncherAuthenticationServiceBinding } from "@versetools/rsi/config/module";
import { createFactory, createModule } from "haywire";

import type { DataModel } from "$convex/_generated/dataModel";

import { sesClientBinding } from "./config/aws";
import { envModule } from "./config/env";
import { subscriptionRegistryBinding } from "./config/subscriptions";

const appModule = createModule(subscriptionRegistryBinding)
	.addBinding(rsiLauncherAuthenticationServiceBinding)
	.addBinding(sesClientBinding);

const bundle = appModule
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

export const containerFactory = createFactory(bundle);

export const router = convexRouter<DataModel>(containerFactory);
