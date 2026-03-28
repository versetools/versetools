import type { Expand, GenericDataModel, GenericMutationCtx } from "convex/server";

import type { Runner } from "../Runner";
import {
	Subscription,
	type AnySubscriptionListener,
	type SubscriptionListener,
	type SubscriptionOptions,
	type SubscriptionPhase
} from "./Subscription";
import type { GenericCtx, GenericQueryableCtx } from "../../helpers";
import type { Class, MaybePromise } from "../../utility-types";
import type { MutationCommand, MutationValue } from "../MutationCommand";
import type { QueryCommand, QueryValue } from "../QueryCommand";
import type { SubscriptionRegistry } from "./SubscriptionRegistry";

export type SubscriptionMiddleware<
	DataModel extends GenericDataModel,
	Ctx extends GenericCtx<DataModel>,
	CommandType extends Class,
	MiddlewareContext extends object = {}
> = (
	runner: Runner<DataModel>,
	ctx: Ctx,
	query: InstanceType<CommandType>,
	next: (context: MiddlewareContext) => void
) => MaybePromise<void>;

export type AnySubscriptionMiddleware<
	DataModel extends GenericDataModel,
	CommandType extends Class,
	Context extends object = {},
	MiddlewareContext extends object = {}
> =
	| SubscriptionMiddleware<
			DataModel,
			GenericQueryableCtx<DataModel> & Context,
			CommandType,
			MiddlewareContext
	  >
	| SubscriptionMiddleware<
			DataModel,
			GenericMutationCtx<DataModel> & Context,
			CommandType,
			MiddlewareContext
	  >;

export abstract class BaseSubscriptionBuilder<
	DataModel extends GenericDataModel,
	CommandType extends Class,
	Context extends object
> {
	protected _listener: AnySubscriptionListener<DataModel, any> | null = null;
	protected middleware: AnySubscriptionMiddleware<DataModel, CommandType, Context, any>[] = [];

	constructor(
		private commandType: Class | null = null,
		private options: SubscriptionOptions = {}
	) {}

	abstract withContext<T extends object>(): BaseSubscriptionBuilder<
		DataModel,
		CommandType,
		Expand<Context & T>
	>;

	abstract withMiddleware<T extends object>(
		middleware: AnySubscriptionMiddleware<DataModel, CommandType, Context, T>
	): BaseSubscriptionBuilder<DataModel, CommandType, Expand<Context & T>>;

	abstract listener(
		listener: any
	): Omit<BaseSubscriptionBuilder<DataModel, CommandType, Context>, "listener" | "withContext">;

	build(context: Context) {
		if (!this.commandType || !this._listener) {
			throw new Error("SubscriptionBuilder state is incomplete");
		}

		const internalListener = this._listener;

		const middleware = this.middleware;
		return new Subscription(
			this.commandType,
			(async (runner, ctx, query, value) => {
				let contextStack = {
					...context
				};

				for (const fn of middleware) {
					let stop = true;
					await fn(
						runner,
						{
							...ctx,
							...contextStack
						} as any,
						query,
						(middlewareContext) => {
							stop = false;
							contextStack = {
								...contextStack,
								...middlewareContext
							};
						}
					);

					if (stop) {
						return;
					}
				}

				internalListener(
					runner,
					{
						...ctx,
						...contextStack
					} as any,
					query,
					value
				);
			}) as SubscriptionListener<DataModel, GenericCtx<DataModel>, CommandType>,
			this.options
		);
	}

	register(registry: SubscriptionRegistry<DataModel>, context: Context) {
		const subscription = this.build(context);
		registry.register(subscription);
	}
}

export type QueryListener<
	DataModel extends GenericDataModel,
	Phase extends SubscriptionPhase,
	Query extends QueryCommand<DataModel>,
	Context extends object = {}
> = Phase extends "after"
	? (
			runner: Runner<DataModel>,
			ctx: GenericQueryableCtx<DataModel> & Context,
			query: Query,
			value: QueryValue<Query>
		) => MaybePromise<void>
	: (
			runner: Runner<DataModel>,
			ctx: GenericQueryableCtx<DataModel> & Context,
			query: Query
		) => MaybePromise<void>;

class QuerySubscriptionBuilder<
	DataModel extends GenericDataModel,
	QueryType extends Class,
	Phase extends SubscriptionPhase = "before",
	Context extends object = {}
> extends BaseSubscriptionBuilder<DataModel, QueryType, Context> {
	withContext<T extends object>() {
		return this as unknown as QuerySubscriptionBuilder<
			DataModel,
			QueryType,
			Phase,
			Expand<Context & T>
		>;
	}

	withMiddleware<T extends object>(
		middleware: SubscriptionMiddleware<
			DataModel,
			GenericQueryableCtx<DataModel> & Context,
			QueryType,
			T
		>
	) {
		this.middleware.push(middleware);
		return this as unknown as QuerySubscriptionBuilder<
			DataModel,
			QueryType,
			Phase,
			Expand<Context & T>
		>;
	}

	listener(fn: QueryListener<DataModel, Phase, InstanceType<QueryType>, Context>) {
		this._listener = fn as QueryListener<DataModel, Phase, InstanceType<QueryType>>;
		return this as unknown as Omit<
			QuerySubscriptionBuilder<DataModel, QueryType, Phase, Context>,
			"listener" | "withContext"
		>;
	}
}

export type MutationListener<
	DataModel extends GenericDataModel,
	Phase extends SubscriptionPhase,
	Mutation extends MutationCommand<DataModel>,
	Context extends object = {}
> = Phase extends "after"
	? (
			runner: Runner<DataModel>,
			ctx: GenericMutationCtx<DataModel> & Context,
			mutation: Mutation,
			value: MutationValue<Mutation>
		) => MaybePromise<void>
	: (
			runner: Runner<DataModel>,
			ctx: GenericMutationCtx<DataModel> & Context,
			mutation: Mutation
		) => MaybePromise<void>;

class MutationSubscriptionBuilder<
	DataModel extends GenericDataModel,
	MutationType extends Class,
	Phase extends SubscriptionPhase = "before",
	Context extends object = {}
> extends BaseSubscriptionBuilder<DataModel, MutationType, Context> {
	withContext<T extends object>() {
		return this as unknown as MutationSubscriptionBuilder<
			DataModel,
			MutationType,
			Phase,
			Expand<Context & T>
		>;
	}

	withMiddleware<T extends object>(
		middleware: SubscriptionMiddleware<
			DataModel,
			GenericMutationCtx<DataModel> & Context,
			MutationType,
			T
		>
	) {
		this.middleware.push(middleware);
		return this as unknown as MutationSubscriptionBuilder<
			DataModel,
			MutationType,
			Phase,
			Expand<Context & T>
		>;
	}

	listener(fn: MutationListener<DataModel, Phase, InstanceType<MutationType>, Context>) {
		this._listener = fn as MutationListener<DataModel, Phase, InstanceType<MutationType>>;
		return this as unknown as Omit<
			QuerySubscriptionBuilder<DataModel, MutationType, Phase, Context>,
			"listener" | "withContext"
		>;
	}
}

export class SubscriptionBuilder<DataModel extends GenericDataModel, Context extends object = {}> {
	withContext<T extends object>() {
		return this as unknown as SubscriptionBuilder<DataModel, Expand<Context & T>>;
	}

	onQuery<QueryType extends Class, Phase extends SubscriptionPhase = "before">(
		queryType: QueryType,
		options?: { once?: boolean; phase?: Phase }
	) {
		return new QuerySubscriptionBuilder<DataModel, QueryType, Phase, Context>(queryType, options);
	}

	onMutation<MutationType extends Class, Phase extends SubscriptionPhase = "before">(
		mutationType: MutationType,
		options?: { once?: boolean; phase?: Phase }
	) {
		return new MutationSubscriptionBuilder<DataModel, MutationType, Phase, Context>(
			mutationType,
			options
		);
	}
}
