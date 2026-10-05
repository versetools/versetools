import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import {
	Subscription,
	type AnySubscriptionListener,
	type SubscriptionListener,
	type SubscriptionOptions,
	type SubscriptionPhase
} from "./Subscription";
import type { GenericCtx, GenericQueryableCtx } from "../../helpers";
import type { RunnerService } from "../../services/commands/RunnerService";
import type { Class, MaybePromise } from "../../utility-types";
import type { MutationCommand, MutationValue } from "../MutationCommand";
import type { QueryCommand, QueryValue } from "../QueryCommand";

export type SubscriptionMiddleware<
	DataModel extends GenericDataModel,
	Ctx extends GenericCtx<DataModel>,
	CommandType extends Class
> = (
	runner: RunnerService<DataModel>,
	ctx: Ctx,
	query: InstanceType<CommandType>,
	next: () => void
) => MaybePromise<void>;

export type AnySubscriptionMiddleware<
	DataModel extends GenericDataModel,
	CommandType extends Class
> =
	| SubscriptionMiddleware<DataModel, GenericQueryableCtx<DataModel>, CommandType>
	| SubscriptionMiddleware<DataModel, GenericMutationCtx<DataModel>, CommandType>;

export abstract class BaseSubscriptionBuilder<
	DataModel extends GenericDataModel,
	CommandType extends Class
> {
	protected middleware: AnySubscriptionMiddleware<DataModel, CommandType>[] = [];

	constructor(
		private commandType: Class | null = null,
		private options: SubscriptionOptions = {}
	) {}

	abstract withMiddleware(
		middleware: AnySubscriptionMiddleware<DataModel, CommandType>
	): BaseSubscriptionBuilder<DataModel, CommandType>;

	listener(internalListener: AnySubscriptionListener<DataModel, any>) {
		if (!this.commandType) {
			throw new Error("SubscriptionBuilder state is incomplete");
		}

		const middleware = this.middleware;
		return new Subscription(
			this.commandType,
			(async (runner, ctx, query, value) => {
				for (const fn of middleware) {
					let stop = true;
					await fn(runner, ctx as any, query, () => {
						stop = false;
					});

					if (stop) {
						return;
					}
				}

				internalListener(runner, ctx as any, query, value);
			}) as SubscriptionListener<DataModel, GenericCtx<DataModel>, CommandType>,
			this.options
		);
	}
}

export type QueryListener<
	DataModel extends GenericDataModel,
	Phase extends SubscriptionPhase,
	Query extends QueryCommand<DataModel>
> = Phase extends "after"
	? (
			runner: RunnerService<DataModel>,
			ctx: GenericQueryableCtx<DataModel>,
			query: Query,
			value: QueryValue<Query>
		) => MaybePromise<void>
	: (
			runner: RunnerService<DataModel>,
			ctx: GenericQueryableCtx<DataModel>,
			query: Query
		) => MaybePromise<void>;

class QuerySubscriptionBuilder<
	DataModel extends GenericDataModel,
	QueryType extends Class,
	Phase extends SubscriptionPhase = "before"
> extends BaseSubscriptionBuilder<DataModel, QueryType> {
	withMiddleware(
		middleware: SubscriptionMiddleware<DataModel, GenericQueryableCtx<DataModel>, QueryType>
	) {
		this.middleware.push(middleware);
		return this as unknown as QuerySubscriptionBuilder<DataModel, QueryType, Phase>;
	}

	listener(fn: QueryListener<DataModel, Phase, InstanceType<QueryType>>) {
		return super.listener(fn);
	}
}

export type MutationListener<
	DataModel extends GenericDataModel,
	Phase extends SubscriptionPhase,
	Mutation extends MutationCommand<DataModel>
> = Phase extends "after"
	? (
			runner: RunnerService<DataModel>,
			ctx: GenericMutationCtx<DataModel>,
			mutation: Mutation,
			value: MutationValue<Mutation>
		) => MaybePromise<void>
	: (
			runner: RunnerService<DataModel>,
			ctx: GenericMutationCtx<DataModel>,
			mutation: Mutation
		) => MaybePromise<void>;

class MutationSubscriptionBuilder<
	DataModel extends GenericDataModel,
	MutationType extends Class,
	Phase extends SubscriptionPhase = "before"
> extends BaseSubscriptionBuilder<DataModel, MutationType> {
	withMiddleware(
		middleware: SubscriptionMiddleware<DataModel, GenericMutationCtx<DataModel>, MutationType>
	) {
		this.middleware.push(middleware);
		return this as unknown as MutationSubscriptionBuilder<DataModel, MutationType, Phase>;
	}

	listener(fn: MutationListener<DataModel, Phase, InstanceType<MutationType>>) {
		return super.listener(fn);
	}
}

export class SubscriptionBuilder<DataModel extends GenericDataModel> {
	onQuery<QueryType extends Class, Phase extends SubscriptionPhase = "before">(
		queryType: QueryType,
		options?: { once?: boolean; phase?: Phase }
	) {
		return new QuerySubscriptionBuilder<DataModel, QueryType, Phase>(queryType, options);
	}

	onMutation<MutationType extends Class, Phase extends SubscriptionPhase = "before">(
		mutationType: MutationType,
		options?: { once?: boolean; phase?: Phase }
	) {
		return new MutationSubscriptionBuilder<DataModel, MutationType, Phase>(mutationType, options);
	}
}

export function subscription<DataModel extends GenericDataModel>() {
	return new SubscriptionBuilder<DataModel>();
}
