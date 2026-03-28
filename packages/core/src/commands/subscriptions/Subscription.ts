import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { GenericCtx, GenericQueryableCtx } from "../../helpers";
import type { Class, MaybePromise } from "../../utility-types";
import type { Runner } from "../Runner";

export type SubscriptionPhase = "before" | "after";

export type SubscriptionListener<
	DataModel extends GenericDataModel,
	Ctx extends GenericCtx<DataModel>,
	CommandType extends Class
> = (
	runner: Runner<DataModel>,
	ctx: Ctx,
	command: InstanceType<CommandType>,
	value?: any
) => MaybePromise<void>;

export type AnySubscriptionListener<
	DataModel extends GenericDataModel,
	CommandType extends Class
> =
	| SubscriptionListener<DataModel, GenericQueryableCtx<DataModel>, CommandType>
	| SubscriptionListener<DataModel, GenericMutationCtx<DataModel>, CommandType>;

export type SubscriptionOptions = {
	once?: boolean;
	phase?: SubscriptionPhase;
};

export class Subscription<DataModel extends GenericDataModel, CommandType extends Class = Class> {
	readonly phase: SubscriptionPhase;
	readonly once: boolean;

	constructor(
		readonly commandType: CommandType,
		private readonly listener: AnySubscriptionListener<DataModel, CommandType>,
		options?: SubscriptionOptions
	) {
		this.phase = options?.phase ?? "before";
		this.once = options?.once ?? false;
	}

	runBefore(
		runner: Runner<DataModel>,
		ctx: GenericCtx<DataModel>,
		command: InstanceType<CommandType>
	) {
		if (this.phase !== "before") {
			return;
		}
		return this.listener(runner, ctx as any, command);
	}

	runAfter(
		runner: Runner<DataModel>,
		ctx: GenericCtx<DataModel>,
		command: InstanceType<CommandType>,
		value: any
	) {
		if (this.phase !== "after") {
			return;
		}
		return this.listener(runner, ctx as any, command, value);
	}
}
