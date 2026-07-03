import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { SubscriptionRegistry } from "./SubscriptionRegistry";
import type {
	Command,
	MutationCommand,
	MutationValue,
	QueryCommand,
	QueryValue
} from "../../../commands";
import type { GenericQueryableCtx } from "../../../helpers/convex";
import type { Class, MaybePromise } from "../../../utility-types";
import type { RunnerService } from "../RunnerService";

export class SubscriptionRunner<DataModel extends GenericDataModel> {
	constructor(
		private readonly runner: RunnerService<DataModel>,
		private readonly registry: SubscriptionRegistry<DataModel>
	) {}

	async runQuerySubscriptions<Query extends QueryCommand<DataModel>>(
		ctx: GenericQueryableCtx<DataModel>,
		query: Query,
		execute: () => MaybePromise<QueryValue<Query>>
	): Promise<QueryValue<Query>> {
		const type = this.getType<typeof QueryCommand>(query);

		for (const subscription of this.registry.getSubscriptions(type, "before")) {
			await subscription.runBefore(this.runner, ctx, query);
			if (subscription.once) {
				this.registry.remove(subscription);
			}
		}

		const value = await execute();

		for (const subscription of this.registry.getSubscriptions(type, "after")) {
			await subscription.runAfter(this.runner, ctx, query, value);
			if (subscription.once) {
				this.registry.remove(subscription);
			}
		}

		return value;
	}

	async runMutationSubscriptions<Mutation extends MutationCommand<DataModel>>(
		ctx: GenericMutationCtx<DataModel>,
		mutation: Mutation,
		execute: () => MaybePromise<MutationValue<Mutation>>
	): Promise<MutationValue<Mutation>> {
		const type = this.getType<typeof MutationCommand>(mutation);

		for (const subscription of this.registry.getSubscriptions(type, "before")) {
			await subscription.runBefore(this.runner, ctx, mutation);
			if (subscription.once) {
				this.registry.remove(subscription);
			}
		}

		const value = await execute();

		for (const subscription of this.registry.getSubscriptions(type, "after")) {
			await subscription.runAfter(this.runner, ctx, mutation, value);
			if (subscription.once) {
				this.registry.remove(subscription);
			}
		}

		return value;
	}

	private getType<T extends Class>(command: Command<DataModel>) {
		const clazz = command.constructor;
		if (!clazz) {
			throw new Error(`Command "${command}" does not have a constructor`);
		}

		return clazz as T;
	}
}
