import type {
	FunctionReference,
	GenericActionCtx,
	GenericDataModel,
	GenericMutationCtx
} from "convex/server";
import { asyncMap } from "convex-helpers";

import type { ActionCommand, ActionValue } from "./ActionCommand";
import { MutationCommand, type MutationValue } from "./MutationCommand";
import { QueryCommand, type QueryValue } from "./QueryCommand";
import { isMutation, isQuery, type GenericCtx, type GenericQueryableCtx } from "../helpers/convex";
import type { SubscriptionRegistry } from "./subscriptions/SubscriptionRegistry";
import { SubscriptionRunner } from "./subscriptions/SubscriptionRunner";

export class Runner<DataModel extends GenericDataModel> {
	private readonly subscriptions: SubscriptionRunner<DataModel>;

	constructor(subscriptionRegistry: SubscriptionRegistry<DataModel>) {
		this.subscriptions = new SubscriptionRunner(this, subscriptionRegistry);
	}

	async query<Query extends QueryCommand<DataModel>>(
		ctx: GenericQueryableCtx<DataModel>,
		query: Query
	): Promise<QueryValue<Query>> {
		console.debug(query);

		return this.subscriptions.runQuerySubscriptions(ctx, query, () => {
			query.runner = this;
			return query.execute(ctx);
		});
	}

	async mapQuery<T, Query extends QueryCommand<DataModel>>(
		ctx: GenericQueryableCtx<DataModel>,
		arr: T[] | IteratorObject<T>,
		callback: (value: T, index: number) => Query
	): Promise<QueryValue<Query>[]> {
		const queries = arr.map(callback);
		return await asyncMap(queries, (query) => this.query(ctx, query));
	}

	async objectQuery<Queries extends { [key: string]: QueryCommand<DataModel> }>(
		ctx: GenericQueryableCtx<DataModel>,
		queries: Queries
	) {
		const entries = await asyncMap(
			Object.entries(queries),
			async ([key, query]) =>
				[key, await this.query(ctx, query)] as [keyof Queries, QueryValue<Queries[keyof Queries]>]
		);
		return Object.fromEntries(entries) as {
			[key in keyof Queries]: QueryValue<Queries[key]>;
		};
	}

	async dynamicQuery<
		Query extends QueryCommand<DataModel>,
		QueryFunctionReference extends FunctionReference<
			"query",
			"internal" | "public",
			any,
			QueryValue<Query>
		>
	>(
		ctx: GenericCtx<DataModel>,
		{
			query,
			func,
			args
		}: {
			query: Query;
			func: QueryFunctionReference;
		} & (keyof QueryFunctionReference["_args"] extends never
			? { args?: undefined }
			: { args: QueryFunctionReference["_args"] })
	): Promise<QueryValue<Query>> {
		if (isQuery(ctx)) {
			return this.query(ctx, query);
		}

		return ctx.runQuery(func, args);
	}

	async mutation<Mutation extends MutationCommand<DataModel>>(
		ctx: GenericMutationCtx<DataModel>,
		mutation: Mutation
	): Promise<MutationValue<Mutation>> {
		console.debug(mutation);

		return this.subscriptions.runMutationSubscriptions(ctx, mutation, () => {
			mutation.runner = this;
			return mutation.execute(ctx);
		});
	}

	async mapMutation<T, Mutation extends MutationCommand<DataModel>>(
		ctx: GenericMutationCtx<DataModel>,
		arr: T[] | IteratorObject<T>,
		callback: (value: T, index: number) => Mutation
	): Promise<MutationValue<Mutation>[]> {
		const mutations = arr.map(callback);
		return await asyncMap(mutations, (mutation) => this.mutation(ctx, mutation));
	}

	async dynamicMutation<
		Mutation extends MutationCommand<DataModel>,
		MutationFunctionReference extends FunctionReference<
			"mutation",
			"internal" | "public",
			any,
			MutationValue<Mutation>
		>
	>(
		ctx: GenericMutationCtx<DataModel> | GenericActionCtx<DataModel>,
		{
			mutation,
			func,
			args
		}: {
			mutation: Mutation;
			func: MutationFunctionReference;
		} & (keyof MutationFunctionReference["_args"] extends never
			? { args?: undefined }
			: { args: MutationFunctionReference["_args"] })
	): Promise<MutationValue<Mutation>> {
		if (isMutation(ctx)) {
			return this.query(ctx, mutation);
		}

		return ctx.runMutation(func, args);
	}

	async action<Action extends ActionCommand<DataModel>>(
		ctx: GenericActionCtx<DataModel>,
		action: Action
	): Promise<ActionValue<Action>> {
		action.runner = this;

		return await action.execute(ctx);
	}
}
