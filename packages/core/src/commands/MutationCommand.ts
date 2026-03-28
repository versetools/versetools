import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import { Command } from "./Command";

export type MutationValue<TMutation extends MutationCommand<any>> = Awaited<
	ReturnType<TMutation["execute"]>
>;

export abstract class MutationCommand<
	DataModel extends GenericDataModel
> extends Command<DataModel> {
	abstract execute(ctx: GenericMutationCtx<DataModel>): Promise<any>;
}
