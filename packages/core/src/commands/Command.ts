import type { GenericDataModel } from "convex/server";

import type { RunnerService } from "../services/commands/RunnerService";

export type CommandValue<T extends Command<any>> = Awaited<ReturnType<T["execute"]>>;

export abstract class Command<DataModel extends GenericDataModel> {
	runner!: RunnerService<DataModel>;

	abstract execute(ctx: any): Promise<any>;
}
