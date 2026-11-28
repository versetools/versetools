import { v, type GenericId, type VString } from "convex/values";
import * as z from "zod/v4";

export const AnyIdSchema = z.string().trim().brand<GenericId<any>>();
export const vAnyId = v.string() as VString<GenericId<any>>;

export type DocReference<TableName extends string> = {
	_id: GenericId<TableName>;
	_tableName: TableName;
};

export const DocReferenceSchema = z.object({
	_id: AnyIdSchema,
	_tableName: z.string().trim()
});

export const vDocReference = v.object({
	_id: vAnyId,
	_tableName: v.string()
});

export function isDocReferenceType<TableName extends string>(
	ref: DocReference<any>,
	tableName: TableName
): ref is DocReference<TableName> {
	return ref._tableName === tableName;
}
