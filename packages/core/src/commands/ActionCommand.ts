import type { GenericActionCtx, GenericDataModel } from "convex/server";

import { Command } from "./Command";

export const unsafeActionCommandSymbol = Symbol("unsafeActionCommandSymbol");

export abstract class ActionCommand<DataModel extends GenericDataModel> extends Command<DataModel> {
	protected readonly [unsafeActionCommandSymbol] = true;

	abstract override execute(ctx: GenericActionCtx<DataModel>): Promise<any>;
}
