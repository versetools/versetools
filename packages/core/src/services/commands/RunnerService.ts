import type { FunctionReference, GenericDataModel } from "convex/server";
import { asyncMap } from "convex-helpers";

import type { SubscriptionRegistry } from "./subscriptions/SubscriptionRegistry";
import { SubscriptionRunner } from "./subscriptions/SubscriptionRunner";
import type {
	ActionCommand,
	ActionValue,
	MutationCommand,
	MutationValue,
	QueryCommand,
	QueryValue
} from "../../commands";
import { assert } from "../../errors";
import {
	isAction,
	isMutation,
	isQuery,
	isRunMutationCtx,
	type GenericCtx
} from "../../helpers/convex";

export class RunnerService<DataModel extends GenericDataModel> {
	private readonly subscriptions: SubscriptionRunner<DataModel>;
	constructor(
		private readonly ctx: GenericCtx<DataModel>,
		subscriptionRegistry: SubscriptionRegistry<DataModel>
	) {
		this.subscriptions = new SubscriptionRunner(this, subscriptionRegistry);
	}

	async query<Query extends QueryCommand<DataModel>>(query: Query): Promise<QueryValue<Query>> {
		assert(isQuery(this.ctx), "Invalid context for query, expected a queryable context");

		console.debug(query);

		return this.subscriptions.runQuerySubscriptions(this.ctx, query, (ctx) => {
			query.runner = this;
			return query.execute(ctx);
		});
	}

	async mapQuery<T, Query extends QueryCommand<DataModel>>(
		arr: T[] | IteratorObject<T>,
		callback: (value: T, index: number) => Query
	): Promise<QueryValue<Query>[]> {
		const queries = arr.map(callback);
		return await asyncMap(queries, (query) => this.query(query));
	}

	async objectQuery<Queries extends { [key: string]: QueryCommand<DataModel> }>(queries: Queries) {
		const entries = await asyncMap(
			Object.entries(queries),
			async ([key, query]) =>
				[key, await this.query(query)] as [keyof Queries, QueryValue<Queries[keyof Queries]>]
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
	>({
		query,
		func,
		args
	}: {
		query: Query;
		func: QueryFunctionReference;
	} & (keyof QueryFunctionReference["_args"] extends never
		? { args?: undefined }
		: { args: QueryFunctionReference["_args"] })): Promise<QueryValue<Query>> {
		if (isQuery(this.ctx)) {
			return this.query(query);
		}

		return this.ctx.runQuery(func, args);
	}

	async mutation<Mutation extends MutationCommand<DataModel>>(
		mutation: Mutation
	): Promise<MutationValue<Mutation>> {
		assert(isMutation(this.ctx), "Invalid context for mutation, expected a mutation context");

		console.debug(mutation);

		return this.subscriptions.runMutationSubscriptions(this.ctx, mutation, (ctx) => {
			mutation.runner = this;
			return mutation.execute(ctx);
		});
	}

	async mapMutation<T, Mutation extends MutationCommand<DataModel>>(
		arr: T[] | IteratorObject<T>,
		callback: (value: T, index: number) => Mutation
	): Promise<MutationValue<Mutation>[]> {
		const mutations = arr.map(callback);
		return await asyncMap(mutations, (mutation) => this.mutation(mutation));
	}

	async dynamicMutation<
		Mutation extends MutationCommand<DataModel>,
		MutationFunctionReference extends FunctionReference<
			"mutation",
			"internal" | "public",
			any,
			MutationValue<Mutation>
		>
	>({
		mutation,
		func,
		args
	}: {
		mutation: Mutation;
		func: MutationFunctionReference;
	} & (keyof MutationFunctionReference["_args"] extends never
		? { args?: undefined }
		: { args: MutationFunctionReference["_args"] })): Promise<MutationValue<Mutation>> {
		if (isMutation(this.ctx)) {
			return this.mutation(mutation);
		}

		assert(
			isRunMutationCtx(this.ctx),
			"Invalid context for dynamic mutation, expected a context with runMutation()"
		);

		return this.ctx.runMutation(func, args);
	}

	async action<Action extends ActionCommand<DataModel>>(
		action: Action
	): Promise<ActionValue<Action>> {
		assert(isAction(this.ctx), "Invalid context for action, expected an action context");

		console.debug(action);

		action.runner = this;
		return await action.execute(this.ctx);
	}
}
