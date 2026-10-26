import type { GenericDataModel } from "convex/server";
import type { GenericHaywireId, IsClass } from "haywire";

import {
	PreparedSubscription,
	SubscriptionPhase,
	type SubscriptionCtx,
	type SubscriptionOptions
} from "./Subscription";
import type { HaywireDependencyIdTypes, IdOrClassToHaywireIds } from "../../haywire-types";
import type { RunnerService } from "../../services/commands/RunnerService";
import type { GenericClass, MaybePromise } from "../../utility-types";
import type { Command } from "../Command";
import { MutationCommand } from "../MutationCommand";
import { QueryCommand } from "../QueryCommand";

export class SubscriptionBuilder<
	DataModel extends GenericDataModel,
	CommandType extends GenericClass<Command<DataModel>>,
	Phase extends SubscriptionPhase = SubscriptionPhase.After
> {
	protected phase: Phase = SubscriptionPhase.After as Phase;
	protected once: boolean = false;

	constructor(private commandType: CommandType) {}

	public executeOnce() {
		this.once = true;
		return this;
	}

	public executeBefore() {
		const builder = this as unknown as SubscriptionBuilder<
			DataModel,
			CommandType,
			SubscriptionPhase.Before
		>;
		builder.phase = SubscriptionPhase.Before;
		return builder;
	}

	public withDependencies<Dependencies extends readonly (GenericHaywireId | IsClass)[]>(
		dependencyIds: [...Dependencies]
	) {
		return new DepsSubscriptionBuilder<
			DataModel,
			CommandType,
			Phase,
			IdOrClassToHaywireIds<Dependencies>
		>(this.commandType, dependencyIds as IdOrClassToHaywireIds<Dependencies>, {
			once: this.once,
			phase: this.phase
		});
	}

	public withCommandProvider(
		provider: (ctx: SubscriptionCtx<DataModel, CommandType, Phase>) => Command<DataModel>
	) {
		return new PreparedSubscription<DataModel, CommandType, readonly [], Phase>(
			this.commandType,
			[],
			async (ctx, runner) => {
				const command = provider(ctx as SubscriptionCtx<DataModel, CommandType, Phase>);
				if (command instanceof QueryCommand) {
					await runner.query(command);
				} else if (command instanceof MutationCommand) {
					await runner.mutation(command);
				}
			},
			{
				once: this.once,
				phase: this.phase
			}
		);
	}

	public withListener(
		listener: (
			ctx: SubscriptionCtx<DataModel, CommandType, Phase>,
			runner: RunnerService<DataModel>
		) => MaybePromise<void>
	) {
		return new PreparedSubscription(this.commandType, [] as const, listener, {
			once: this.once,
			phase: this.phase
		});
	}
}

class DepsSubscriptionBuilder<
	DataModel extends GenericDataModel,
	CommandType extends GenericClass<Command<DataModel>>,
	Phase extends SubscriptionPhase,
	DependencyIds extends readonly [...GenericHaywireId[]]
> {
	constructor(
		private commandType: CommandType,
		private dependencyIds: DependencyIds,
		private options: SubscriptionOptions<Phase>
	) {}

	public withCommandProvider(
		provider: (
			ctx: SubscriptionCtx<DataModel, CommandType, Phase>,
			...deps: HaywireDependencyIdTypes<DependencyIds>
		) => Command<DataModel>
	) {
		return new PreparedSubscription<DataModel, CommandType, DependencyIds, Phase>(
			this.commandType,
			this.dependencyIds,
			async (ctx, runner, ...deps) => {
				const command = provider(ctx, ...deps);
				if (command instanceof QueryCommand) {
					await runner.query(command);
				} else if (command instanceof MutationCommand) {
					await runner.mutation(command);
				}
			},
			this.options
		);
	}

	public withListener(
		listener: (
			ctx: SubscriptionCtx<DataModel, CommandType, Phase>,
			runner: RunnerService<DataModel>,
			...deps: HaywireDependencyIdTypes<DependencyIds>
		) => MaybePromise<void>
	) {
		return new PreparedSubscription(this.commandType, this.dependencyIds, listener, this.options);
	}
}
