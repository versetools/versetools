import type { GenericDataModel } from "convex/server";

import type { Runner } from "./Runner";

export abstract class Command<DataModel extends GenericDataModel> {
	runner!: Runner<DataModel>;
}
