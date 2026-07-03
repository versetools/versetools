import type { GenericDataModel } from "convex/server";

import type { RunnerService } from "../services/commands/RunnerService";

export abstract class Command<DataModel extends GenericDataModel> {
	runner!: RunnerService<DataModel>;
}
