import type { GenericDataModel } from "convex/server";
import { createModule, type Binding, type GenericHaywireId, type OutputHaywireId } from "haywire";

import { type Command, type PreparedSubscription } from "..";
import { SubscriptionBuilder } from "./SubscriptionBuilder";
import { subscriptionTag } from "../../config/ids/commands";
import type { HaywireModuleFromBindings } from "../../haywire-types";
import type { GenericClass } from "../../utility-types";

type GenericSubscriptionBinding = Binding<OutputHaywireId<typeof subscriptionTag>, any, false>;

export class SubscriptionsModuleBuilder<
	DataModel extends GenericDataModel,
	Bindings extends [...GenericSubscriptionBinding[]] = []
> {
	constructor(private readonly bindings: Bindings) {}

	public subscribe<
		CommandType extends GenericClass<Command<DataModel>>,
		DependencyIds extends readonly [...GenericHaywireId[]]
	>(
		commandType: CommandType,
		build: (
			subscriptionBuilder: SubscriptionBuilder<DataModel, CommandType>
		) => PreparedSubscription<DataModel, CommandType, DependencyIds>
	) {
		const builder = new SubscriptionBuilder<DataModel, CommandType>(commandType);
		const prepared = build(builder);

		const binding = prepared.toBinding();
		return new SubscriptionsModuleBuilder([...this.bindings, binding] as [
			...Bindings,
			typeof binding
		]);
	}

	public toModule() {
		if (!this.bindings.length) {
			throw new Error("Failed to create module: no subscriptions.");
		}

		return this.bindings
			.slice(1)
			.reduce(
				(module, binding) => module.addBinding(binding),
				createModule(this.bindings[0])
			) as HaywireModuleFromBindings<Bindings>;
	}
}

export function createSubscriptionsModuleBuilder<DataModel extends GenericDataModel>() {
	return new SubscriptionsModuleBuilder<DataModel>([]);
}
