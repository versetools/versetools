import type { GenericDataModel } from "convex/server";

import { Command } from "./Command";
import type { GenericQueryableCtx } from "../helpers/convex";

export const unsafeQueryCommandSymbol = Symbol("unsafeQueryCommandSymbol");

export abstract class QueryCommand<DataModel extends GenericDataModel> extends Command<DataModel> {
	protected readonly [unsafeQueryCommandSymbol] = true;

	abstract override execute(ctx: GenericQueryableCtx<DataModel>): Promise<any>;
}
