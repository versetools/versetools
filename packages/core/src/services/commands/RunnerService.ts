import type { FunctionReference, GenericDataModel } from "convex/server";
import { asyncMap } from "convex-helpers";
import type { Container } from "haywire";

import type { SubscriptionRegistry } from "./subscriptions/SubscriptionRegistry";
import { SubscriptionRunner } from "./subscriptions/SubscriptionRunner";
import type {
	ActionCommand,
	Command,
	CommandValue,
	MutationCommand,
	QueryCommand
} from "../../commands";
import { assert } from "../../errors";
import {
	isAction,
	isMutation,
	isQuery,
	isRunMutationCtx,
	type GenericCtx
} from "../../helpers/convex";
import type { RequestCustomMetadata } from "../../routers";
import type { Invalid, ValidationFailure } from "../../validation-types";

type ValidateRequiredDataModelForCommand<
	T extends Command<any>,
	DataModel extends GenericDataModel
> = 0 extends 1 & DataModel
	? [never]
	: T extends Command<infer RequiredDataModel>
		? DataModel extends RequiredDataModel
			? [never]
			: [ValidationFailure<"DataModel does not satisfy requirements for command">]
		: [ValidationFailure<"Not a command">];

type ValidateRequiredDataModelForCommandsObject<
	T extends Record<string, Command<any>>,
	DataModel extends GenericDataModel
> = [
	...{
		[key in keyof T]: ValidateRequiredDataModelForCommand<T[key], DataModel>;
	}[keyof T]
];

export class RunnerService<DataModel extends GenericDataModel> {
	private readonly subscriptions: SubscriptionRunner<DataModel>;
	constructor(
		private readonly container: Container<any>,
		private readonly ctx: GenericCtx<DataModel> & { customMetadata: RequestCustomMetadata },
		subscriptionRegistry: SubscriptionRegistry<DataModel>
	) {
		this.subscriptions = new SubscriptionRunner(this, subscriptionRegistry);
	}

	public getContext() {
		return this.ctx;
	}

	public async query<Query extends QueryCommand<any>>(
		query: Invalid<ValidateRequiredDataModelForCommand<Query, DataModel>> & Query
	): Promise<CommandValue<Query>> {
		assert(isQuery(this.ctx), "Invalid context for query, expected a queryable context");

		console.debug(query);

		return this.subscriptions.runQuerySubscriptions(this.ctx, query, (ctx) => {
			return this.prepareCommand(query).execute(ctx);
		});
	}

	public async mapQuery<T, Query extends QueryCommand<any>>(
		arr: T[],
		callback: (
			value: T,
			index: number
		) => Invalid<ValidateRequiredDataModelForCommand<NoInfer<Query>, DataModel>> & Query
	): Promise<CommandValue<Query>[]> {
		const queries = arr.map(callback);
		return await asyncMap(queries, (query) => this.query(query));
	}

	public async objectQuery<Queries extends { [key: string]: QueryCommand<any> }>(
		queries: Invalid<ValidateRequiredDataModelForCommandsObject<Queries, DataModel>> & Queries
	) {
		const entries = await asyncMap(
			Object.entries(queries),
			async ([key, query]) =>
				[key, await this.query(query)] as [keyof Queries, CommandValue<Queries[keyof Queries]>]
		);
		return Object.fromEntries(entries) as {
			[key in keyof Queries]: CommandValue<Queries[key]>;
		};
	}

	public async dynamicQuery<
		Query extends QueryCommand<any>,
		QueryFunctionReference extends FunctionReference<
			"query",
			"internal" | "public",
			any,
			CommandValue<Query>
		>
	>({
		query,
		func,
		args
	}: {
		query: Invalid<ValidateRequiredDataModelForCommand<Query, DataModel>> & Query;
		func: QueryFunctionReference;
	} & (keyof QueryFunctionReference["_args"] extends never
		? { args?: undefined }
		: { args: QueryFunctionReference["_args"] })): Promise<CommandValue<Query>> {
		if (isQuery(this.ctx)) {
			return this.query(query);
		}

		return this.ctx.runQuery(func, args);
	}

	public async mutation<Mutation extends MutationCommand<any>>(
		mutation: Invalid<ValidateRequiredDataModelForCommand<Mutation, DataModel>> & Mutation
	): Promise<CommandValue<Mutation>> {
		assert(isMutation(this.ctx), "Invalid context for mutation, expected a mutation context");

		console.debug(mutation);

		return this.subscriptions.runMutationSubscriptions(this.ctx, mutation, (ctx) => {
			return this.prepareCommand(mutation).execute(ctx);
		});
	}

	public async mapMutation<T, Mutation extends MutationCommand<any>>(
		arr: T[],
		callback: (
			value: T,
			index: number
		) => Invalid<ValidateRequiredDataModelForCommand<NoInfer<Mutation>, DataModel>> & Mutation
	): Promise<CommandValue<Mutation>[]> {
		const mutations = arr.map(callback);
		return await asyncMap(mutations, (mutation) => this.mutation(mutation));
	}

	public async dynamicMutation<
		Mutation extends MutationCommand<any>,
		MutationFunctionReference extends FunctionReference<
			"mutation",
			"internal" | "public",
			any,
			CommandValue<Mutation>
		>
	>({
		mutation,
		func,
		args
	}: {
		mutation: Invalid<ValidateRequiredDataModelForCommand<Mutation, DataModel>> & Mutation;
		func: MutationFunctionReference;
	} & (keyof MutationFunctionReference["_args"] extends never
		? { args?: undefined }
		: { args: MutationFunctionReference["_args"] })): Promise<CommandValue<Mutation>> {
		if (isMutation(this.ctx)) {
			return this.mutation(mutation);
		}

		assert(
			isRunMutationCtx(this.ctx),
			"Invalid context for dynamic mutation, expected a context with runMutation()"
		);

		return this.ctx.runMutation(func, args);
	}

	public async action<Action extends ActionCommand<any>>(
		action: Invalid<ValidateRequiredDataModelForCommand<Action, DataModel>> & Action
	): Promise<CommandValue<Action>> {
		assert(isAction(this.ctx), "Invalid context for action, expected an action context");

		console.debug(action);

		return await this.prepareCommand(action).execute(this.ctx);
	}

	private prepareCommand(command: Command<any>) {
		command.runner = this;
		command.container = this.container;
		return command;
	}
}
