import { createCoreModule } from "@versetools/core/config/module";
import { convexRouter, genericArgsId, genericCtxId } from "@versetools/core/routers";
import { rsiModule } from "@versetools/rsi/config/module";
import { createContainerFactory, createModule, type HaywireIdType } from "haywire";

import type { DataModel } from "$convex/_generated/dataModel";

import { sesClientBinding } from "./config/aws";
import { envModule } from "./config/env";
import { subscriptionRegistryBinding } from "./config/subscriptions";

const appModule = createModule(subscriptionRegistryBinding).addBinding(sesClientBinding);

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
	.mergeModule(envModule)
	.mergeModule(rsiModule);

export const containerFactory = createContainerFactory(bundle);

if (import.meta.env.DEV) {
	containerFactory
		.bindInstance(genericCtxId, {} as HaywireIdType<typeof genericCtxId>)
		.bindInstance(genericArgsId, {})
		.toContainer();
}

export const router = convexRouter<DataModel>(containerFactory);
