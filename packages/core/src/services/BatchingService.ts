import type { FunctionReference } from "convex/server";
import { v, type GenericId } from "convex/values";
import { asyncMap } from "convex-helpers";

import { assert } from "../errors";
import {
	isSchedulerCtx,
	vAnyId,
	vDocReference,
	type GenericDocReference,
	type GenericCtx
} from "../helpers";
import type { ConvexRouter } from "../routers";

const DELETION_BATCH_SIZE = 1000;

export type BatchingFunctionReferences = {
	batchDeleteRefs: FunctionReference<
		"mutation",
		"internal",
		{
			refs: GenericDocReference<any>[];
		},
		null
	>;
	batchDeleteRows: FunctionReference<
		"mutation",
		"internal",
		{
			tableName: string;
			ids: GenericId<any>[];
		},
		null
	>;
};

export class BatchingService {
	public static createRoutes(router: ConvexRouter<any, any>) {
		const batchDeleteRefs = router
			.internalMutation({
				args: {
					refs: v.array(vDocReference)
				}
			})
			.withDependencies(({ ctxId, argsId }) => [ctxId, argsId, BatchingService])
			.withHandler(async (ctx, args, batching): Promise<void> => {
				const batch = args.refs.slice(0, DELETION_BATCH_SIZE);
				const remaining = args.refs.slice(DELETION_BATCH_SIZE);
				if (remaining.length) {
					await batching.batchDeleteRefs(remaining);
				}

				await asyncMap(batch, async (ref) => {
					if (!(await ctx.db.get(ref._tableName, ref._id))) return;
					await ctx.db.delete(ref._tableName, ref._id);
				});
			});

		const batchDeleteRows = router
			.internalMutation({
				args: {
					tableName: v.string(),
					ids: v.array(vAnyId)
				}
			})
			.withDependencies(({ ctxId, argsId }) => [ctxId, argsId, BatchingService])
			.withHandler(async (ctx, args, batching): Promise<void> => {
				const batch = args.ids.slice(0, DELETION_BATCH_SIZE);
				const remaining = args.ids.slice(DELETION_BATCH_SIZE);
				if (remaining.length) {
					await batching.batchDeleteRows(args.tableName, remaining);
				}

				await asyncMap(batch, async (id) => {
					if (!(await ctx.db.get(args.tableName, id))) return;
					await ctx.db.delete(args.tableName, id);
				});
			});

		return {
			batchDeleteRefs,
			batchDeleteRows
		};
	}

	constructor(
		private readonly ctx: GenericCtx<any>,
		private readonly functionReferences: BatchingFunctionReferences
	) {}

	public batchDeleteRefs(refs: GenericDocReference<any>[]) {
		assert(isSchedulerCtx(this.ctx), "Expected context with scheduler");

		return this.ctx.scheduler.runAfter(0, this.functionReferences.batchDeleteRefs, {
			refs
		});
	}

	public batchDeleteRows<TableName extends string>(
		tableName: TableName,
		ids: GenericId<TableName>[]
	) {
		assert(isSchedulerCtx(this.ctx), "Expected context with scheduler");

		return this.ctx.scheduler.runAfter(0, this.functionReferences.batchDeleteRows, {
			tableName,
			ids
		});
	}
}
