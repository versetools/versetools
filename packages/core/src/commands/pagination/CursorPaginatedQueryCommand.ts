import {
	type DocumentByName,
	type GenericDataModel,
	type OrderedQuery,
	type PaginationOptions,
	type TableNamesInDataModel
} from "convex/server";
import { v } from "convex/values";
import * as z from "zod";

import type { GenericQueryableCtx } from "../../helpers/convex";
import { QueryCommand } from "../QueryCommand";

export type CursorPaginationOptions = {
	query?: string | null;
	paginationOpts: Omit<PaginationOptions, "numItems"> &
		Partial<Pick<PaginationOptions, "numItems">>;
};

export abstract class CursorPaginatedQueryCommand<
	DataModel extends GenericDataModel,
	TableName extends TableNamesInDataModel<DataModel>,
	T = DocumentByName<DataModel, TableName>
> extends QueryCommand<DataModel> {
	protected readonly defaultNumItems: number = 10;

	constructor(readonly pagination: CursorPaginationOptions) {
		super();
	}

	public async execute(ctx: GenericQueryableCtx<DataModel>) {
		const query = this.query(ctx, this.pagination?.query);

		const result = await query.paginate({
			...this.pagination.paginationOpts,
			numItems: this.pagination.paginationOpts.numItems ?? this.defaultNumItems
		});

		return {
			...result,
			page: await Promise.all(result.page.map((doc) => this.map(ctx, doc)))
		};
	}

	protected abstract query(
		ctx: GenericQueryableCtx<DataModel>,
		query?: string | null
	): OrderedQuery<DataModel[TableName]>;

	protected async map(
		ctx: GenericQueryableCtx<DataModel>,
		doc: DocumentByName<DataModel, TableName>
	): Promise<T> {
		return doc as T;
	}
}

export function vCursorPaginationOptions() {
	return {
		query: v.optional(v.nullable(v.string())),
		paginationOpts: v.object({
			numItems: v.optional(v.number()),
			cursor: v.union(v.string(), v.null()),
			endCursor: v.optional(v.union(v.string(), v.null())),
			id: v.optional(v.number()),
			maximumRowsRead: v.optional(v.number()),
			maximumBytesRead: v.optional(v.number())
		})
	};
}

export function zCursorPaginationOptions() {
	return {
		query: z.string().nullish(),
		paginationOpts: z.object({
			numItems: z.number(),
			cursor: z.string().nullable(),
			endCursor: z.string().nullish(),
			id: z.number().optional(),
			maximumRowsRead: z.number().optional(),
			maximumBytesRead: z.number().optional()
		})
	};
}
