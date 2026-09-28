import { createCoreModule } from "@versetools/core/config/module";
import { convexRouter, genericArgsId, genericCtxId } from "@versetools/core/routers";
import { rsiModule } from "@versetools/rsi/config/module";
import { createContainer, createFactory, createModule, type HaywireIdType } from "haywire";

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

export const factory = createFactory(bundle);

if (import.meta.env.DEV) {
	createContainer(
		factory
			.register(genericCtxId, {} as HaywireIdType<typeof genericCtxId>)
			.register(genericArgsId, {})
	);
}

export const router = convexRouter<DataModel>(factory);
