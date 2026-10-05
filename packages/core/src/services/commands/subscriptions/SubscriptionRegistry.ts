import type { GenericDataModel } from "convex/server";

import { type Subscription, type SubscriptionPhase } from "../../../commands";
import type { Class, RestOrArray } from "../../../utility-types";

export class SubscriptionRegistry<DataModel extends GenericDataModel> {
	private subscriptionsByType = new Map<
		Class,
		Record<SubscriptionPhase, Subscription<DataModel>[]>
	>();

	register(
		...subscriptions: RestOrArray<Subscription<DataModel>>
	): SubscriptionRegistry<DataModel> {
		for (const subscription of subscriptions.flat()) {
			let subscriptionsByPhase = this.subscriptionsByType.get(subscription.commandType);

			if (!subscriptionsByPhase) {
				subscriptionsByPhase = {
					before: [],
					after: []
				};
				this.subscriptionsByType.set(subscription.commandType, subscriptionsByPhase);
			}

			subscriptionsByPhase[subscription.phase].push(subscription);
		}

		return this;
	}

	unregister(subscription: Subscription<DataModel>): SubscriptionRegistry<DataModel> {
		const subscriptions = this.subscriptionsByType.get(subscription.commandType);
		if (subscriptions) {
			subscriptions[subscription.phase] = subscriptions[subscription.phase].filter(
				(s) => s !== subscription
			);
		}

		return this;
	}

	getSubscriptions(commandType: Class, phase: SubscriptionPhase) {
		const subscriptions = this.subscriptionsByType.get(commandType);
		if (!subscriptions) {
			return [];
		}

		return subscriptions[phase];
	}
}
