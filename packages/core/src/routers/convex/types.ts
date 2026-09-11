import type {
	ArgsArray,
	DefaultFunctionArgs,
	GenericQueryCtx,
	GenericMutationCtx,
	GenericActionCtx,
	GenericDataModel,
	ArgsArrayToObject,
	FunctionType
} from "convex/server";
import type { ArgsId, CtxId } from "./ids";
import type { Infer, ObjectType, PropertyValidators } from "convex/values";
import type { Validator } from "convex/values";
import * as zCore from "zod/v4/core";
import type { GenericHaywireFactory } from "../../haywire-types";
import type { GenericCtx } from "../../helpers";
import type { HaywireId } from "haywire";
import type { RunnerService } from "../../services/commands/RunnerService";

// Function types //

export type ContextForFunctionType<
	Type extends FunctionType,
	DataModel extends GenericDataModel
> = {
	query: GenericQueryCtx<DataModel>;
	mutation: GenericMutationCtx<DataModel>;
	action: GenericActionCtx<DataModel>;
}[Type];

// Zod //

export type ZodFields = Record<string, zCore.$ZodType>;

// Options //

type ConvexArgOptions = {
	validator?: "convex";
	args?: PropertyValidators | Validator<any, "required", any> | void;
	returns?: PropertyValidators | Validator<any, "required", any> | void;
	skipConvexValidation?: false;
};

type ZodArgOptions = {
	validator: "zod";
	args?: ZodFields | zCore.$ZodObject<any> | void;
	returns?: zCore.$ZodType | ZodFields | void;
	skipConvexValidation?: boolean;
};

export type RouteBuilderOptions<ExtraConfig extends Record<string, any>> = {
	[key in keyof ExtraConfig as key extends "validator" | "args" | "skipConvexValidation" | "returns"
		? never
		: key]: ExtraConfig[key];
} & (ConvexArgOptions | ZodArgOptions);

// Arg arrays //

export type ArgsArrayFromConvexValidator<
	ArgsValidator extends PropertyValidators | Validator<any, "required", any> | void
> = [ArgsValidator] extends [Validator<any, any, any>]
	? [Infer<ArgsValidator>]
	: [ArgsValidator] extends [PropertyValidators]
		? [ObjectType<ArgsValidator>]
		: ArgsArray;

export type ArgsArrayFromZodValidator<
	ArgsValidator extends ZodFields | zCore.$ZodObject<any> | void
> = [ArgsValidator] extends [zCore.$ZodObject<any>]
	? [zCore.output<ArgsValidator>]
	: [ArgsValidator] extends [ZodFields]
		? [zCore.output<zCore.$ZodObject<ArgsValidator, zCore.$strict>>]
		: ArgsArray;

export type ArgsArrayFromOptionsOptionalValidator<Options extends RouteBuilderOptions<any>> =
	Options["validator"] extends "zod"
		? Options["args"] extends ZodFields | zCore.$ZodObject<any> | void
			? ArgsArrayFromZodValidator<Options["args"]>
			: []
		: Options["args"] extends PropertyValidators | Validator<any, "required", any> | void
			? ArgsArrayFromConvexValidator<Options["args"]>
			: [];

// Dependency Ids //

export type DependencyIdsObject<
	DataModel extends GenericDataModel,
	Type extends FunctionType,
	Options extends RouteBuilderOptions<any>
> = {
	runnerId: HaywireId<RunnerService<DataModel>, null, null, false, false, false, false>;
	ctxId: CtxId<ContextForFunctionType<Type, DataModel>>;
} & (ArgsArrayFromOptionsOptionalValidator<Options> extends [
	infer ArgsObject extends DefaultFunctionArgs
]
	? {
			argsId: ArgsId<ArgsObject>;
		}
	: {
			argsId?: undefined;
		});

// Middleware //

export type Middleware<
	DataModel extends GenericDataModel,
	InputFactory extends GenericHaywireFactory,
	ArgsValidator extends PropertyValidators | void,
	OutputFactory extends GenericHaywireFactory,
	MiddlewareConfig extends Record<string, any> = Record<string, any>
> = {
	args?: ArgsValidator;
	handler: (
		factory: InputFactory,
		ctx: GenericCtx<DataModel>,
		args: ArgsArrayToObject<ArgsArrayFromConvexValidator<ArgsValidator>>,
		config: MiddlewareConfig
	) => OutputFactory;
};
