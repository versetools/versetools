import type { GenericDataModel } from "convex/server";
import { type Binding, type GenericHaywireId, type Module, type OutputHaywireId } from "haywire";

import { type Command, type PreparedSubscription } from "..";
import { SubscriptionBuilder } from "./SubscriptionBuilder";
import { subscriptionTag } from "../../config/ids/commands";
import type { HaywireAddBindingsToModule } from "../../haywire-types";
import type { GenericClass } from "../../utility-types";

type GenericSubscriptionBinding = Binding<OutputHaywireId<typeof subscriptionTag>, any, false>;

export class SubscriptionBindingsBuilder<
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
		) => PreparedSubscription<CommandType, DependencyIds, any>
	) {
		const builder = new SubscriptionBuilder<DataModel, CommandType>(commandType);
		const prepared = build(builder);

		const binding = prepared.toBinding<DataModel>();
		return new SubscriptionBindingsBuilder<DataModel, [...Bindings, typeof binding]>([
			...this.bindings,
			binding
		]);
	}

	public addToModule<T extends Module<any, any, any, any>>(
		module: T
	): HaywireAddBindingsToModule<T, Bindings> {
		if (!this.bindings.length) {
			throw new Error("Failed to create module: no subscriptions.");
		}

		for (const binding of this.bindings) {
			module = module.addBinding(binding) as any;
		}

		return module as any;
	}
}

export function createSubscriptionBindingsBuilder<DataModel extends GenericDataModel>() {
	return new SubscriptionBindingsBuilder<DataModel>([]);
}
