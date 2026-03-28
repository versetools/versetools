import type { GenericDataModel } from "convex/server";
import { v, type GenericId, type VFloat64 } from "convex/values";
import { zid } from "convex-helpers/server/zod4";
import * as z from "zod";

import { OffsetPagination } from "./OffsetPagination";
import type { GenericQueryableCtx } from "../../helpers/convex";
import { QueryCommand } from "../QueryCommand";

export type OffsetPaginationOptions<Cursor> = {
	query?: string | null;
	cursor?: Cursor | null;
	end?: boolean | null;
	take?: number | null;
};

export abstract class OffsetPaginatedQueryCommand<
	DataModel extends GenericDataModel,
	T extends { _id: GenericId<any> }
> extends QueryCommand<DataModel> {
	protected readonly defaultTake: number = 10;

	constructor(
		readonly pagination?: OffsetPaginationOptions<T["_id"]>,
		readonly filter?: (items: T[]) => T[]
	) {
		super();
	}

	public async execute(ctx: GenericQueryableCtx<DataModel>) {
		const take = this.pagination?.take ?? this.defaultTake;

		const items = await this.collect(ctx, this.pagination?.query);
		const filteredItems = this.filter ? this.filter(items) : items;

		const pagination = new OffsetPagination(filteredItems);
		const page = this.pagination?.end
			? await pagination.end(take)
			: await pagination.at(this.pagination?.cursor ?? null, take);

		return {
			...page,
			perPage: take
		};
	}

	protected abstract collect(
		ctx: GenericQueryableCtx<DataModel>,
		query?: string | null
	): Promise<T[]>;
}

export function vOffsetPaginationOptions<TableName extends string, Take extends number>(
	tableName: TableName,
	takeOptions?: Take[]
) {
	return {
		query: v.optional(v.nullable(v.string())),
		cursor: v.optional(v.nullable(v.id(tableName))),
		end: v.optional(v.nullable(v.boolean())),
		take: v.optional(
			v.nullable(
				takeOptions
					? v.union(...takeOptions.map((take) => v.literal(take)))
					: (v.number() as VFloat64<Take, "required">)
			)
		)
	};
}

export function zOffsetPaginationOptions<TableName extends string, Take extends number>(
	tableName: TableName,
	takeOptions?: Take[]
) {
	return {
		query: z.string().nullish(),
		cursor: zid(tableName).nullish(),
		end: z.boolean().nullish(),
		take: (takeOptions
			? z.union(takeOptions.map((take) => z.literal(take)))
			: (z.number() as unknown as z.ZodUnion<z.ZodLiteral<Take>[]>)
		).nullish()
	};
}
