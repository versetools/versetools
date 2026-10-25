import type { GenericDataModel } from "convex/server";

import { Command } from "./Command";
import type { GenericQueryableCtx } from "../helpers/convex";

export abstract class QueryCommand<DataModel extends GenericDataModel> extends Command<DataModel> {
	abstract override execute(ctx: GenericQueryableCtx<DataModel>): Promise<any>;
}
