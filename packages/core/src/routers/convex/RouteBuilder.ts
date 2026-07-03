import type {
	ArgsArray,
	ArgsArrayToObject,
	DefaultFunctionArgs,
	FunctionVisibility,
	GenericActionCtx,
	GenericDataModel,
	GenericMutationCtx,
	GenericQueryCtx
} from "convex/server";
import type { Infer, ObjectType, PropertyValidators, Validator } from "convex/values";
import type { Registration } from "convex-helpers/server/customFunctions";
import { type GenericHaywireId, type HaywireId, type IsClass } from "haywire";
import * as zCore from "zod/v4/core";

import type { ConvexRouter } from "./ConvexRouter";
import { genericArgsId, genericCtxId } from "./ids";
import type { HaywireDependencyIdTypes, IdOrClassToHaywireIds } from "../../haywire-types";

type ConvexArgOptions = {
	validator?: "convex";
	args?: PropertyValidators | Validator<any, "required", any> | void;
};

type ZodFields = Record<string, zCore.$ZodType>;

type ZodArgOptions = {
	validator: "zod";
	args?: ZodFields | zCore.$ZodObject<any> | void;
	skipConvexValidation?: boolean;
};

export type RouteBuilderOptions = {} & (ConvexArgOptions | ZodArgOptions);

type CtxId<Ctx extends GenericQueryCtx<any> | GenericMutationCtx<any> | GenericActionCtx<any>> =
	HaywireId<Ctx, null, null, false, false, false, false>;

type ArgsId<ArgsObject extends DefaultFunctionArgs = DefaultFunctionArgs> = HaywireId<
	ArgsObject,
	null,
	null,
	false,
	false,
	false,
	false
>;

type ArgsArrayToArgsIdArray<Args extends ArgsArray> = Args extends [
	infer ArgsObject extends DefaultFunctionArgs
]
	? [ArgsId<ArgsObject>]
	: [];

type ArgsArrayFromConvexValidator<
	ArgsValidator extends PropertyValidators | Validator<any, "required", any> | void
> = [ArgsValidator] extends [Validator<any, any, any>]
	? [Infer<ArgsValidator>]
	: [ArgsValidator] extends [PropertyValidators]
		? [ObjectType<ArgsValidator>]
		: ArgsArray;

type ArgsArrayFromZodValidator<ArgsValidator extends ZodFields | zCore.$ZodObject<any> | void> = [
	ArgsValidator
] extends [zCore.$ZodObject<any>]
	? [zCore.output<ArgsValidator>]
	: [ArgsValidator] extends [ZodFields]
		? [zCore.output<zCore.$ZodObject<ArgsValidator, zCore.$strict>>]
		: ArgsArray;

type ArgsArrayFromOptionsOptionalValidator<Options extends RouteBuilderOptions> =
	Options["validator"] extends "zod"
		? Options["args"] extends ZodFields | zCore.$ZodObject<any> | void
			? ArgsArrayFromZodValidator<Options["args"]>
			: []
		: Options["args"] extends PropertyValidators | Validator<any, "required", any> | void
			? ArgsArrayFromConvexValidator<Options["args"]>
			: [];

type ArgsIdArrayFromOptions<Options extends RouteBuilderOptions> = ArgsArrayToArgsIdArray<
	ArgsArrayFromOptionsOptionalValidator<Options>
>;

type ContextForFunctionType<
	FunctionType extends "query" | "mutation" | "action",
	DataModel extends GenericDataModel
> = {
	query: GenericQueryCtx<DataModel>;
	mutation: GenericMutationCtx<DataModel>;
	action: GenericActionCtx<DataModel>;
}[FunctionType];

export class RouteBuilder<
	DataModel extends GenericDataModel,
	FunctionType extends "query" | "mutation" | "action",
	Visibility extends FunctionVisibility,
	Options extends RouteBuilderOptions
> {
	constructor(
		private readonly router: ConvexRouter<DataModel>,
		private readonly functionType: FunctionType,
		private readonly visibility: Visibility,
		private readonly options: Options
	) {}

	withDependencies<Dependencies extends readonly (GenericHaywireId | IsClass)[]>(
		dependencyIdsSupplier: (
			ctxId: CtxId<ContextForFunctionType<FunctionType, DataModel>>,
			...argsId: ArgsIdArrayFromOptions<Options>
		) => [...Dependencies]
	) {
		const dependencyIds = dependencyIdsSupplier(
			genericCtxId as CtxId<ContextForFunctionType<FunctionType, DataModel>>,
			...([genericArgsId] as ArgsIdArrayFromOptions<Options>)
		);

		return new DepsRouteBuilder(
			this.router,
			this.functionType,
			this.visibility,
			this.options,
			dependencyIds as IdOrClassToHaywireIds<Dependencies>
		);
	}

	withHandler<ReturnValue>(
		handler: (
			ctx: ContextForFunctionType<FunctionType, DataModel>,
			...args: ArgsArrayFromOptionsOptionalValidator<Options>
		) => ReturnValue
	): Registration<
		FunctionType,
		Visibility,
		ArgsArrayToObject<ArgsArrayFromOptionsOptionalValidator<Options>>,
		ReturnValue
	> {}
}

class DepsRouteBuilder<
	DataModel extends GenericDataModel,
	FunctionType extends "query" | "mutation" | "action",
	Visibility extends FunctionVisibility,
	Options extends RouteBuilderOptions,
	DependencyIds extends readonly [...GenericHaywireId[]]
> {
	constructor(
		private readonly router: ConvexRouter<DataModel>,
		private readonly functionType: FunctionType,
		private readonly visibility: Visibility,
		private readonly options: Options,
		private readonly dependencyIds: DependencyIds
	) {}

	withHandler<ReturnValue>(
		handler: (...deps: HaywireDependencyIdTypes<DependencyIds>) => ReturnValue
	): Registration<
		FunctionType,
		Visibility,
		ArgsArrayToObject<ArgsArrayFromOptionsOptionalValidator<Options>>,
		ReturnValue
	> {}
}
