import type { Subscription } from "@versetools/core/commands";
import { subscriptionTag } from "@versetools/core/config/ids/commands";
import { createCoreModule } from "@versetools/core/config/module";
import { convexRouter, genericArgsId, genericCtxId } from "@versetools/core/routers";
import { rsiModule } from "@versetools/rsi/config/module";
import { createContainerFactory, createModule, type HaywireIdType } from "haywire";

import type { DataModel } from "$convex/_generated/dataModel";

import { sesClientBinding } from "./config/aws";
import { envModule } from "./config/env";

const appModule = createModule(sesClientBinding);

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
		.bindInstance(subscriptionTag, {} as Subscription<any, any>)
		.toContainer();
}

export const router = convexRouter<DataModel>(containerFactory);
