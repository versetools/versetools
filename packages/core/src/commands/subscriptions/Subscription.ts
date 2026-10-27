import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { bind, type GenericHaywireId } from "haywire";

import { subscriptionTag } from "../../config/ids/commands";
import type { HaywireDependencyIdTypes } from "../../haywire-types";
import type { GenericCtx } from "../../helpers";
import type { RunnerService } from "../../services/commands/RunnerService";
import type { GenericClass, MaybePromise } from "../../utility-types";
import type { Command, CommandValue } from "../Command";
import type { MutationCommand } from "../MutationCommand";
import type { QueryCommand } from "../QueryCommand";

export enum SubscriptionPhase {
	Before = "before",
	After = "after"
}

export type SubscriptionOptions<Phase extends SubscriptionPhase = SubscriptionPhase> = {
	once?: boolean;
	phase?: Phase;
};

type CommandTypeToCtx<
	DataModel extends GenericDataModel,
	CommandType extends GenericClass<Command<any>>
> =
	InstanceType<CommandType> extends MutationCommand<DataModel>
		? GenericMutationCtx<DataModel>
		: InstanceType<CommandType> extends QueryCommand<DataModel>
			? GenericQueryCtx<DataModel>
			: GenericCtx<DataModel>;

export type SubscriptionCtx<
	DataModel extends GenericDataModel,
	CommandType extends GenericClass<Command<DataModel>>,
	Phase extends SubscriptionPhase
> = CommandTypeToCtx<DataModel, CommandType> & {
	command: InstanceType<CommandType>;
} & (Phase extends SubscriptionPhase.Before
		? { commandReturnValue?: undefined }
		: { commandReturnValue: CommandValue<InstanceType<CommandType>> });

type SubscriptionListener<
	DataModel extends GenericDataModel,
	CommandType extends GenericClass<Command<DataModel>>,
	DependencyIds extends readonly [...GenericHaywireId[]],
	Phase extends SubscriptionPhase
> = (
	ctx: SubscriptionCtx<DataModel, CommandType, Phase>,
	runner: RunnerService<DataModel>,
	...deps: HaywireDependencyIdTypes<DependencyIds>
) => MaybePromise<void>;

export class PreparedSubscription<
	DataModel extends GenericDataModel,
	CommandType extends GenericClass<Command<DataModel>> = GenericClass<Command<DataModel>>,
	DependencyIds extends readonly [...GenericHaywireId[]] = [],
	Phase extends SubscriptionPhase = SubscriptionPhase.After
> {
	constructor(
		readonly commandType: CommandType,
		readonly dependencyIds: DependencyIds,
		private readonly listener: SubscriptionListener<DataModel, CommandType, DependencyIds, Phase>,
		private readonly options?: SubscriptionOptions
	) {}

	public toBinding() {
		return bind(subscriptionTag)
			.withDependencies(this.dependencyIds)
			.withProvider((...deps) => {
				return new Subscription<DataModel, CommandType>(
					this.commandType,
					deps,
					this.listener as SubscriptionListener<DataModel, CommandType, any, SubscriptionPhase>,
					this.options
				);
			});
	}
}

export class Subscription<
	DataModel extends GenericDataModel,
	CommandType extends GenericClass<Command<DataModel>> = GenericClass<Command<DataModel>>
> {
	readonly phase: SubscriptionPhase;
	readonly once: boolean;

	constructor(
		readonly commandType: CommandType,
		private readonly dependencies: readonly unknown[],
		private readonly listener: SubscriptionListener<DataModel, CommandType, any, SubscriptionPhase>,
		options?: SubscriptionOptions
	) {
		this.phase = options?.phase ?? SubscriptionPhase.After;
		this.once = options?.once ?? false;
	}

	/** @internal */
	runBefore(
		ctx: GenericCtx<DataModel>,
		runner: RunnerService<DataModel>,
		command: InstanceType<CommandType>
	) {
		if (this.phase !== SubscriptionPhase.Before) return;

		const subscriptionCtx = {
			...ctx,
			command
		} as SubscriptionCtx<DataModel, CommandType, SubscriptionPhase.Before>;

		return this.listener(subscriptionCtx, runner, ...this.dependencies);
	}

	/** @internal */
	runAfter(
		ctx: GenericCtx<DataModel>,
		runner: RunnerService<DataModel>,
		command: InstanceType<CommandType>,
		returnValue: any
	) {
		if (this.phase !== SubscriptionPhase.After) return;

		const subscriptionCtx = {
			...ctx,
			command,
			commandReturnValue: returnValue
		} as SubscriptionCtx<DataModel, CommandType, SubscriptionPhase.After>;

		return this.listener(subscriptionCtx, runner, ...this.dependencies);
	}
}
