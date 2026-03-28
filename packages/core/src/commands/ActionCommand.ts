import type { GenericActionCtx, GenericDataModel } from "convex/server";

import { Command } from "./Command";

export type ActionValue<TAction extends ActionCommand<any>> = Awaited<
	ReturnType<TAction["execute"]>
>;

export abstract class ActionCommand<DataModel extends GenericDataModel> extends Command<DataModel> {
	abstract execute(ctx: GenericActionCtx<DataModel>): Promise<any>;
}
