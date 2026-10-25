import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import { Command } from "./Command";

export abstract class MutationCommand<
	DataModel extends GenericDataModel
> extends Command<DataModel> {
	abstract override execute(ctx: GenericMutationCtx<DataModel>): Promise<any>;
}
