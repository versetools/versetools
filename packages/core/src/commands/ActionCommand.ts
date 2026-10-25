import type { GenericActionCtx, GenericDataModel } from "convex/server";

import { Command } from "./Command";

export abstract class ActionCommand<DataModel extends GenericDataModel> extends Command<DataModel> {
	abstract override execute(ctx: GenericActionCtx<DataModel>): Promise<any>;
}
