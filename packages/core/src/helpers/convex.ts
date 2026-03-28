import type {
	Expression,
	ExpressionOrValue,
	FilterBuilder,
	FunctionReference,
	FunctionReturnType,
	FunctionVisibility,
	GenericActionCtx,
	GenericDatabaseWriter,
	GenericDataModel,
	GenericMutationCtx,
	GenericQueryCtx,
	GenericTableInfo,
	OptionalRestArgs,
	TableNamesInDataModel
} from "convex/server";
import { v, type GenericId, type GenericValidator, type Value, type VLiteral } from "convex/values";
import { asyncMap } from "convex-helpers";

import type { NonUnion } from "../utility-types";

export type GenericQueryableCtx<DataModel extends GenericDataModel> =
	| GenericQueryCtx<DataModel>
	| GenericMutationCtx<DataModel>;

export type GenericCtx<DataModel extends GenericDataModel> =
	| GenericQueryCtx<DataModel>
	| GenericMutationCtx<DataModel>
	| GenericActionCtx<DataModel>;

export type RunQueryCtx = {
	runQuery: <Query extends FunctionReference<"query", FunctionVisibility>>(
		query: Query,
		...args: OptionalRestArgs<Query>
	) => Promise<FunctionReturnType<Query>>;
};

export type RunMutationCtx = {
	runMutation: <Mutation extends FunctionReference<"mutation", FunctionVisibility>>(
		mutation: Mutation,
		...args: OptionalRestArgs<Mutation>
	) => Promise<FunctionReturnType<Mutation>>;
};

export function isQuery<DataModel extends GenericDataModel>(
	ctx: GenericCtx<DataModel>
): ctx is GenericQueryCtx<DataModel> {
	return "db" in ctx;
}

export function isMutation<DataModel extends GenericDataModel>(
	ctx: GenericCtx<DataModel>
): ctx is GenericMutationCtx<DataModel> {
	return "db" in ctx && "insert" in ctx.db;
}

export function isAction<DataModel extends GenericDataModel>(
	ctx: GenericCtx<DataModel>
): ctx is GenericActionCtx<DataModel> {
	return !("db" in ctx);
}

export function isConvexCtx<DataModel extends GenericDataModel>(
	ctx: any
): ctx is GenericCtx<DataModel> {
	return ctx && typeof ctx === "object" && ("db" in ctx || "runQuery" in ctx);
}

export function isRunMutationCtx<DataModel extends GenericDataModel>(
	ctx: GenericCtx<DataModel>
): ctx is GenericMutationCtx<DataModel> | GenericActionCtx<DataModel> {
	return "runMutation" in ctx;
}

// Queries //

function extendBuilder<
	TTableInfo extends GenericTableInfo,
	TBuilder extends FilterBuilder<TTableInfo>
>(q: TBuilder) {
	return Object.assign(q, {
		in<T extends Value | undefined>(l: ExpressionOrValue<T>, r: T[]): Expression<boolean> {
			return q.or(...r.map((v) => q.eq(l, v)));
		}
	});
}

type ExtendedFilterBuilder<
	TTableInfo extends GenericTableInfo,
	TBuilder extends FilterBuilder<TTableInfo>
> = ReturnType<typeof extendBuilder<TTableInfo, TBuilder>>;

export function xf<TTableInfo extends GenericTableInfo, TBuilder extends FilterBuilder<TTableInfo>>(
	q: TBuilder,
	predicate: (q: ExtendedFilterBuilder<TTableInfo, TBuilder>) => ExpressionOrValue<boolean>
) {
	return predicate(extendBuilder(q));
}

// Mutations //

export async function deleteAllIds<
	DataModel extends GenericDataModel,
	TableName extends TableNamesInDataModel<NoInfer<DataModel>>
>(
	db: GenericDatabaseWriter<DataModel>,
	tableName: NonUnion<TableName>,
	ids: GenericId<TableName>[]
) {
	await asyncMap(ids, (id) => db.delete(tableName, id));
}

export async function deleteAll<
	DataModel extends GenericDataModel,
	TableName extends TableNamesInDataModel<NoInfer<DataModel>>,
	Row extends { _id: GenericId<TableName> }
>(
	db: GenericDatabaseWriter<DataModel>,
	tableName: NonUnion<TableName>,
	rows: Row[],
	{
		before,
		after
	}: {
		before?: (row: Row) => void | Promise<void>;
		after?: (row: Row) => void | Promise<void>;
	} = {}
) {
	await asyncMap(rows, async (row) => {
		if (before) await before(row);
		await db.delete(tableName, row._id);
		if (after) await after(row);
	});
}

/** Values */

export type Enum<E, Value extends number | string = number | string> = Record<keyof E, Value> & {
	[k: number]: string;
};

export function vEnum<TType extends Enum<TType>>(enumx: TType) {
	return v.union<VLiteral<TType[keyof TType]>[]>(
		...Object.values(enumx)
			.filter((value) => typeof value === "string")
			.map((value) => v.literal(value as TType[keyof TType]))
	);
}

export function vRecord<K extends string, V extends GenericValidator>(
	keys: K[],
	valueValidator: V
) {
	return v.object(
		Object.fromEntries(keys.map((key) => [key, valueValidator])) as {
			[key in K]: V;
		}
	);
}

export function vEnumRecord<EnumValue extends string, V extends GenericValidator>(
	enumx: Enum<any, EnumValue>,
	valueValidator: V
) {
	const keys = Object.values(enumx).filter((value) => typeof value === "string");
	return vRecord(keys, valueValidator);
}
