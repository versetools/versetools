import type { GenericDataModel } from "convex/server";

import { Command } from "./Command";
import type { GenericQueryableCtx } from "../helpers/convex";

export type QueryValue<Query extends QueryCommand<any>> = Awaited<ReturnType<Query["execute"]>>;

export abstract class QueryCommand<DataModel extends GenericDataModel> extends Command<DataModel> {
	abstract execute(ctx: GenericQueryableCtx<DataModel>): Promise<any>;
}
