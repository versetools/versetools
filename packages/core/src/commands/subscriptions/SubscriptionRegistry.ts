import type { GenericDataModel } from "convex/server";

import type { Subscription, SubscriptionPhase } from "./Subscription";
import { BaseSubscriptionBuilder } from "./SubscriptionBuilder";
import type { Class, RestOrArray } from "../../utility-types";

export class SubscriptionRegistry<DataModel extends GenericDataModel> {
	private subscriptionsByType = new Map<
		Class,
		Record<SubscriptionPhase, Subscription<DataModel>[]>
	>();

	tryRegisterFrom<Context extends object>({
		holders,
		context
	}: {
		holders: (
			| {
					[key in
						| "subscription"
						| "createSubscription"
						| "updateSubscription"
						| "deleteSubscription"]?: Pick<BaseSubscriptionBuilder<any, any, Context>, "build">;
			  }
			| {}
		)[];
		context: NoInfer<Context>;
	}) {
		this.register(
			...holders.flatMap((holder) =>
				Object.values(holder)
					.filter((value) => value instanceof BaseSubscriptionBuilder)
					.map((builder) => builder.build(context))
			)
		);
	}

	register(...subscriptions: RestOrArray<Subscription<DataModel>>) {
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
	}

	remove(subscription: Subscription<DataModel>) {
		const subscriptions = this.subscriptionsByType.get(subscription.commandType);
		if (!subscriptions) {
			return;
		}

		subscriptions[subscription.phase] = subscriptions[subscription.phase].filter(
			(s) => s !== subscription
		);
	}

	getSubscriptions(commandType: Class, phase: SubscriptionPhase) {
		const subscriptions = this.subscriptionsByType.get(commandType);
		if (!subscriptions) {
			return [];
		}

		return subscriptions[phase];
	}
}
