import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { SubscriptionRegistry } from "./SubscriptionRegistry";
import type {
	Command,
	MutationCommand,
	MutationValue,
	QueryCommand,
	QueryValue
} from "../../../commands";
import { getClass } from "../../../helpers";
import type { GenericQueryableCtx } from "../../../helpers/convex";
import type { MaybePromise } from "../../../utility-types";
import type { RunnerService } from "../RunnerService";

export class SubscriptionRunner<DataModel extends GenericDataModel> {
	constructor(
		private readonly runner: RunnerService<DataModel>,
		private readonly registry: SubscriptionRegistry<DataModel>
	) {}

	async runQuerySubscriptions<Query extends QueryCommand<DataModel>>(
		ctx: GenericQueryableCtx<DataModel>,
		query: Query,
		execute: (ctx: GenericQueryableCtx<DataModel>) => MaybePromise<QueryValue<Query>>
	): Promise<QueryValue<Query>> {
		const queryClass = getClass(query);

		for (const subscription of this.registry.getSubscriptions(type, "before")) {
			await subscription.runBefore(this.runner, ctx, query);
			if (subscription.once) {
				this.registry.unregister(subscription);
			}
		}

		const value = await execute(ctx);

		for (const subscription of this.registry.getSubscriptions(type, "after")) {
			await subscription.runAfter(this.runner, ctx, query, value);
			if (subscription.once) {
				this.registry.unregister(subscription);
			}
		}

		return value;
	}

	async runMutationSubscriptions<Mutation extends MutationCommand<DataModel>>(
		ctx: GenericMutationCtx<DataModel>,
		mutation: Mutation,
		execute: (ctx: GenericMutationCtx<DataModel>) => MaybePromise<MutationValue<Mutation>>
	): Promise<MutationValue<Mutation>> {
		const mutationClass = getClass(mutation);

		for (const subscription of this.registry.getSubscriptions(type, "before")) {
			await subscription.runBefore(this.runner, ctx, mutation);
			if (subscription.once) {
				this.registry.unregister(subscription);
			}
		}

		const value = await execute(ctx);

		for (const subscription of this.registry.getSubscriptions(type, "after")) {
			await subscription.runAfter(this.runner, ctx, mutation, value);
			if (subscription.once) {
				this.registry.unregister(subscription);
			}
		}

		return value;
	}
}
