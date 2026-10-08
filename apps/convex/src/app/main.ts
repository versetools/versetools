import { createCoreModule } from "@versetools/core/config/module";
import { convexRouter } from "@versetools/core/routers";
import { rsiModule } from "@versetools/rsi/config/module";
import { createModule } from "haywire";

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
			fileStorage: "uploadthing",
			runner: {
				subscriptions: false
			}
		})
	)
	.mergeModule(envModule)
	.mergeModule(rsiModule);

// containerFactory
// 	.bindInstance(genericCtxId, {} as HaywireIdType<typeof genericCtxId>)
// 	.bindInstance(genericArgsId, {})
// 	.bindInstance(subscriptionTag, {} as Subscription<any, any>)
// 	.toContainer();

export const router = convexRouter<DataModel>(bundle);
