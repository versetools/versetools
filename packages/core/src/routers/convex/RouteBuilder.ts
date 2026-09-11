import {
	type ArgsArrayToObject,
	type FunctionVisibility,
	type GenericDataModel,
	type FunctionType
} from "convex/server";
import type { Registration } from "convex-helpers/server/customFunctions";
import { type GenericHaywireId, type IsClass } from "haywire";

import type { ConvexRouter } from "./ConvexRouter";
import { genericArgsId, genericCtxId } from "./ids";
import type { HaywireDependencyIdTypes, IdOrClassToHaywireIds } from "../../haywire-types";
import type {
	ArgsArrayFromOptionsOptionalValidator,
	ContextForFunctionType,
	DependencyIdsObject,
	RouteBuilderOptions
} from "./types";
import { createRegistration } from "./registration";
import { genericRunnerServiceId } from "../../config/ids/commands";

export type { RouteBuilderOptions } from "./types";

export class RouteBuilder<
	DataModel extends GenericDataModel,
	Router extends ConvexRouter<DataModel, any, any>,
	Type extends FunctionType,
	Visibility extends FunctionVisibility,
	Options extends RouteBuilderOptions<any>
> {
	constructor(
		private readonly router: Router,
		private readonly functionType: Type,
		private readonly visibility: Visibility,
		private readonly options: Options
	) {}

	withDependencies<Dependencies extends readonly (GenericHaywireId | IsClass)[]>(
		dependencyIdsSupplier: (ids: DependencyIdsObject<DataModel, Type, Options>) => [...Dependencies]
	) {
		const dependencyIds = dependencyIdsSupplier({
			runnerId: genericRunnerServiceId,
			ctxId: genericCtxId,
			argsId: genericArgsId
		} as unknown as DependencyIdsObject<DataModel, Type, Options>);

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
			ctx: ContextForFunctionType<Type, DataModel>,
			...args: ArgsArrayFromOptionsOptionalValidator<Options>
		) => ReturnValue
	): Registration<
		Type,
		Visibility,
		ArgsArrayToObject<ArgsArrayFromOptionsOptionalValidator<Options>>,
		ReturnValue
	> {
		return createRegistration({
			functionType: this.functionType,
			visibility: this.visibility,
			dependencyIds: [],
			middlewarePipeline: this.router._middlewarePipeline,
			handler,
			options: this.options,
			factory: this.router._factory
		});
	}
}

class DepsRouteBuilder<
	DataModel extends GenericDataModel,
	Type extends FunctionType,
	Visibility extends FunctionVisibility,
	Options extends RouteBuilderOptions<any>,
	DependencyIds extends readonly [...GenericHaywireId[]]
> {
	constructor(
		private readonly router: ConvexRouter<DataModel>,
		private readonly functionType: Type,
		private readonly visibility: Visibility,
		private readonly options: Options,
		private readonly dependencyIds: DependencyIds
	) {}

	withHandler<ReturnValue>(
		handler: (...deps: HaywireDependencyIdTypes<DependencyIds>) => ReturnValue
	): Registration<
		Type,
		Visibility,
		ArgsArrayToObject<ArgsArrayFromOptionsOptionalValidator<Options>>,
		ReturnValue
	> {
		return createRegistration({
			functionType: this.functionType,
			visibility: this.visibility,
			dependencyIds: this.dependencyIds,
			middlewarePipeline: this.router._middlewarePipeline,
			handler,
			options: this.options,
			factory: this.router._factory
		});
	}
}
