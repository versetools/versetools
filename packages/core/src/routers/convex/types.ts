import type {
	DefaultFunctionArgs,
	GenericQueryCtx,
	GenericMutationCtx,
	GenericActionCtx,
	GenericDataModel,
	FunctionType
} from "convex/server";
import type { Infer, ObjectType, PropertyValidators } from "convex/values";
import type { Validator } from "convex/values";
import type { EmptyObject } from "convex-helpers";
import type { GenericHaywireId, HaywireId } from "haywire";
import * as zCore from "zod/v4/core";

import type { ArgsId, CtxId } from "./ids";
import type {
	HaywireGenericContainerFactory,
	HaywireGenericModule,
	HaywireModuleToContainerFactory
} from "../../haywire-types";
import type { GenericCtx } from "../../helpers";
import type { RunnerService } from "../../services/commands/RunnerService";
import type { MaybePromise } from "../../utility-types";
import type { RequestMetadata } from "../types";

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

// Args //

export type ArgsFromConvexValidator<
	ArgsValidator extends PropertyValidators | Validator<any, "required", any> | void
> =
	ArgsValidator extends Validator<any, any, any>
		? Infer<ArgsValidator>
		: ArgsValidator extends PropertyValidators
			? ObjectType<ArgsValidator>
			: EmptyObject;

export type ArgsFromZodValidator<ArgsValidator extends ZodFields | zCore.$ZodObject<any> | void> =
	ArgsValidator extends zCore.$ZodObject<any>
		? zCore.output<ArgsValidator>
		: ArgsValidator extends ZodFields
			? zCore.output<zCore.$ZodObject<ArgsValidator, zCore.$strict>>
			: EmptyObject;

export type ArgsFromOptionsOptionalValidator<Options extends RouteBuilderOptions<any>> =
	Options["validator"] extends "zod"
		? Options["args"] extends ZodFields | zCore.$ZodObject<any> | void
			? ArgsFromZodValidator<Options["args"]>
			: EmptyObject
		: Options["args"] extends PropertyValidators | Validator<any, "required", any> | void
			? ArgsFromConvexValidator<Options["args"]>
			: EmptyObject;

export type ArgsToArgsArray<Args extends DefaultFunctionArgs> = Args extends EmptyObject
	? []
	: [Args];

// Middleware //

export type MiddlewareCtx<
	DataModel extends GenericDataModel,
	Config extends Record<string, any> = Record<string, any>
> = GenericCtx<DataModel> & { middlewareConfig: Config; customMetadata: RequestMetadata };

export type MiddlewareAddBindings<
	DataModel extends GenericDataModel,
	ArgsValidator extends PropertyValidators | void,
	InputModule extends HaywireGenericModule,
	ModifiedModule extends HaywireGenericModule,
	Config extends Record<string, any> = Record<string, any>
> = (
	module: InputModule,
	ctx: MiddlewareCtx<DataModel, Config>,
	...args: ArgsToArgsArray<ArgsFromConvexValidator<ArgsValidator>>
) => MaybePromise<ModifiedModule>;

export type MiddlewareBindInstances<
	DataModel extends GenericDataModel,
	ArgsValidator extends PropertyValidators | void,
	InputFactory extends HaywireGenericContainerFactory,
	ModifiedFactory extends HaywireGenericContainerFactory,
	Config extends Record<string, any> = Record<string, any>
> = (
	factory: InputFactory,
	ctx: MiddlewareCtx<DataModel, Config>,
	...args: ArgsToArgsArray<ArgsFromConvexValidator<ArgsValidator>>
) => MaybePromise<ModifiedFactory>;

export type DefaultMiddlewareHandler<
	DataModel extends GenericDataModel,
	ArgsValidator extends PropertyValidators | void,
	Config extends Record<string, any> = Record<string, any>
> = (
	ctx: MiddlewareCtx<DataModel, Config>,
	...args: ArgsToArgsArray<ArgsFromConvexValidator<ArgsValidator>>
) => MaybePromise<void>;

export interface Middleware<
	DataModel extends GenericDataModel,
	ArgsValidator extends PropertyValidators | void,
	InputModule extends HaywireGenericModule,
	ModifiedModule extends HaywireGenericModule,
	ModifiedFactory extends HaywireGenericContainerFactory,
	Config extends Record<string, any> = Record<string, any>
> {
	readonly args?: ArgsValidator;
	readonly addBindings?: MiddlewareAddBindings<
		DataModel,
		ArgsValidator,
		InputModule,
		ModifiedModule,
		Config
	>;
	readonly bindInstances?: MiddlewareBindInstances<
		DataModel,
		ArgsValidator,
		HaywireModuleToContainerFactory<ModifiedModule>,
		ModifiedFactory,
		Config
	>;
	readonly dependencyIds?: readonly GenericHaywireId[];
	readonly handler?: (ctx: MiddlewareCtx<DataModel, Config>, ...args: any[]) => MaybePromise<void>;
}

// Middleware Options //

export type MiddlewareBuilderOptions = {
	args?: PropertyValidators | void;
};

// Route //

export type DefaultRouteHandler<
	DataModel extends GenericDataModel,
	Type extends FunctionType,
	Options extends RouteBuilderOptions<any>,
	ReturnValue
> = (
	ctx: ContextForFunctionType<Type, DataModel> & { customMetadata: RequestMetadata },
	...args: ArgsToArgsArray<ArgsFromOptionsOptionalValidator<Options>>
) => ReturnValue;

// Route Options //

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
	[
		key in keyof ExtraConfig as key extends
			"validator" | "args" | "skipConvexValidation" | "returns"
			? never
			: key
	]: ExtraConfig[key];
} & (ConvexArgOptions | ZodArgOptions);

// Dependency Ids //

export type DependencyIdsObject<
	DataModel extends GenericDataModel,
	Type extends FunctionType,
	Options extends RouteBuilderOptions<any>
> = {
	runnerId: HaywireId<RunnerService<DataModel>, null, null, false, false, false, false, false>;
	ctxId: CtxId<ContextForFunctionType<Type, DataModel>>;
} & (ArgsFromOptionsOptionalValidator<Options> extends infer ArgsObject extends DefaultFunctionArgs
	? {
			argsId: ArgsId<ArgsObject>;
		}
	: {
			argsId?: undefined;
		});
