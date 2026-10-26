import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import { Command } from "./Command";

const unsafeMutationCommandSymbol = Symbol("unsafeMutationCommandSymbol");

export abstract class MutationCommand<
	DataModel extends GenericDataModel
> extends Command<DataModel> {
	protected readonly [unsafeMutationCommandSymbol] = true;

	abstract override execute(ctx: GenericMutationCtx<DataModel>): Promise<any>;
}
