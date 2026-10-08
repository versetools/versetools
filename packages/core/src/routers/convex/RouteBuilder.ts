import { type FunctionVisibility, type GenericDataModel, type FunctionType } from "convex/server";
import type { ObjectType } from "convex/values";
import type { Registration } from "convex-helpers/server/customFunctions";
import { type GenericHaywireId, type IsClass } from "haywire";

import type { ConvexRouter } from "./ConvexRouter";
import { genericArgsId, genericCtxId } from "./ids";
import { createRegistration } from "./registration";
import type { middlewareArgsType } from "./symbols";
import type {
	ArgsFromOptionsOptionalValidator,
	DefaultRouteHandler,
	DependencyIdsObject,
	RouteBuilderOptions
} from "./types";
import { genericRunnerServiceId } from "../../config/ids/commands";
import type { HaywireDependencyIdTypes, IdOrClassToHaywireIds } from "../../haywire-types";

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

		return new DepsRouteBuilder<
			DataModel,
			Router,
			Type,
			Visibility,
			Options,
			IdOrClassToHaywireIds<Dependencies>
		>(
			this.router,
			this.functionType,
			this.visibility,
			this.options,
			dependencyIds as IdOrClassToHaywireIds<Dependencies>
		);
	}

	withHandler<ReturnValue>(
		handler: DefaultRouteHandler<DataModel, Type, Options, ReturnValue>
	): Registration<
		Type,
		Visibility,
		ArgsFromOptionsOptionalValidator<Options> & ObjectType<Router[typeof middlewareArgsType]>,
		ReturnValue
	> {
		return createRegistration({
			router: this.router,
			functionType: this.functionType,
			visibility: this.visibility,
			dependencyIds: [genericCtxId, genericArgsId],
			handler,
			options: this.options
		});
	}
}

class DepsRouteBuilder<
	DataModel extends GenericDataModel,
	Router extends ConvexRouter<DataModel, any, any>,
	Type extends FunctionType,
	Visibility extends FunctionVisibility,
	Options extends RouteBuilderOptions<any>,
	DependencyIds extends readonly [...GenericHaywireId[]]
> {
	constructor(
		private readonly router: Router,
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
		ArgsFromOptionsOptionalValidator<Options> & ObjectType<Router[typeof middlewareArgsType]>,
		ReturnValue
	> {
		return createRegistration({
			router: this.router,
			functionType: this.functionType,
			visibility: this.visibility,
			dependencyIds: this.dependencyIds,
			handler,
			options: this.options
		});
	}
}
