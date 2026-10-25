import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { SubscriptionRegistry } from "./SubscriptionRegistry";
import {
	SubscriptionPhase,
	type CommandValue,
	type MutationCommand,
	type QueryCommand
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
		execute: (ctx: GenericQueryableCtx<DataModel>) => MaybePromise<CommandValue<Query>>
	): Promise<CommandValue<Query>> {
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
		execute: (ctx: GenericMutationCtx<DataModel>) => MaybePromise<CommandValue<Mutation>>
	): Promise<CommandValue<Mutation>> {
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
