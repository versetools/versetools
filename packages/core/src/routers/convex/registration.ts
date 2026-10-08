import {
	actionGeneric,
	internalActionGeneric,
	internalMutationGeneric,
	internalQueryGeneric,
	mutationGeneric,
	queryGeneric,
	type DefaultFunctionArgs,
	type FunctionType,
	type FunctionVisibility
} from "convex/server";
import {
	ConvexError,
	type PropertyValidators,
	type Validator,
	type Value,
	type VObject
} from "convex/values";
import { pick } from "convex-helpers";
import type { Registration } from "convex-helpers/server/customFunctions";
import { zodOutputToConvex, zodToConvexFields } from "convex-helpers/server/zod4";
import { addFieldsToValidator } from "convex-helpers/validators";
import { createContainerFactory, type Container, type GenericHaywireId } from "haywire";
import * as z from "zod/v4";
import * as zCore from "zod/v4/core";

import type { ConvexRouter } from "./ConvexRouter";
import { genericArgsId, genericCtxId } from "./ids";
import { unsafeMiddlewarePipeline, unsafeRouterModule } from "./symbols";
import type { RouteBuilderOptions, ZodFields } from "./types";
import { ServerConfigurationError } from "../../errors";
import type { HaywireGenericModule } from "../../haywire-types";
import type { GenericCtx } from "../../helpers";
import type { Class } from "../../utility-types";
import type { RequestMetadata } from "../types";

type GenericBuilder<
	Type extends FunctionType,
	Visibility extends FunctionVisibility,
	Args extends DefaultFunctionArgs,
	Output
> = (options: {
	args?: PropertyValidators | Validator<any, "required", any> | void;
	returns?: PropertyValidators | Validator<any, "required", any> | void;
	handler: (ctx: GenericCtx<any>, ...args: any) => Output;
}) => Registration<Type, Visibility, Args, Output>;

type RegistrationParams = {
	router: ConvexRouter<any, any>;
	functionType: FunctionType;
	visibility: FunctionVisibility;
	dependencyIds: readonly GenericHaywireId[];
	handler: (...args: any) => any;
	options: RouteBuilderOptions<any>;
};

function isObjectEmpty(obj: object) {
	for (const prop in obj) {
		if (Object.hasOwn(obj, prop)) {
			return false;
		}
	}

	return true;
}

function resolveDependencies(
	container: Container<any>,
	dependencyIds: readonly GenericHaywireId[]
) {
	return Promise.all(
		dependencyIds.map(async (id) => {
			try {
				return await container.getAsync(id);
			} catch (e) {
				throw new ServerConfigurationError({
					message: `Failed to resolve route dependency with id: ${id.toString()}`,
					cause: `${e}`
				});
			}
		})
	);
}

export function createRegistration<
	Type extends FunctionType,
	Visibility extends FunctionVisibility,
	Args extends DefaultFunctionArgs,
	Output
>(params: RegistrationParams) {
	let builder: GenericBuilder<any, any, any, any>;

	switch (params.functionType) {
		case "query":
			builder = params.visibility === "internal" ? internalQueryGeneric : queryGeneric;
			break;
		case "mutation":
			builder = params.visibility === "internal" ? internalMutationGeneric : mutationGeneric;
			break;
		case "action":
			builder = params.visibility === "internal" ? internalActionGeneric : actionGeneric;
			break;
	}

	const { validator, args, returns, skipConvexValidation, ...extra } = params.options;

	let returnsValidator: PropertyValidators | Validator<any, "required", any> | undefined =
		undefined;

	if (returns && !skipConvexValidation) {
		switch (validator) {
			case "zod":
				returnsValidator = zodOutputToConvex(
					returns instanceof zCore.$ZodType ? returns : z.object(returns)
				);
				break;
			default:
				returnsValidator = returns;
		}
	}

	let argsValidator: PropertyValidators | Validator<any, "required", any> | undefined = undefined;

	if (args && !skipConvexValidation) {
		switch (validator) {
			case "zod": {
				let zodValidator = args;
				if (zodValidator instanceof zCore.$ZodType) {
					if (zodValidator instanceof zCore.$ZodObject) {
						zodValidator = zodValidator._zod.def.shape;
					} else {
						throw new Error(
							"Unsupported zod type as args validator: " + (zodValidator as Class).constructor.name
						);
					}
				}
				argsValidator = zodToConvexFields(zodValidator as ZodFields);
				break;
			}
			default:
				argsValidator = args;
		}
	}

	const middlewarePipeline = params.router[unsafeMiddlewarePipeline];

	let fullArgsValidator = argsValidator;
	for (const middleware of middlewarePipeline) {
		if (!middleware.args) continue;

		if (!fullArgsValidator) {
			fullArgsValidator = middleware.args;
			continue;
		}

		fullArgsValidator = addFieldsToValidator(
			fullArgsValidator as VObject<any, any, any, string>,
			middleware.args
		);
	}

	if (!args && skipConvexValidation && fullArgsValidator) {
		throw new Error(
			"If you're using middleware with arguments, you cannot skip convex validation."
		);
	}

	return builder({
		args: fullArgsValidator,
		returns: returnsValidator,
		handler: async (rawCtx: GenericCtx<any>, allArgs: any) => {
			const ctx = rawCtx as GenericCtx<any> & { customMetadata: RequestMetadata };
			ctx.customMetadata = {};

			const middlewareEntries = Array.from(middlewarePipeline.entries()).map(
				([index, middleware]) => ({
					index,
					middleware,
					args: pick(allArgs, Object.keys(middleware.args ?? {}))
				})
			);

			let containerModule = params.router[unsafeRouterModule] as HaywireGenericModule;
			for (const { middleware, args: middlewareArgs } of middlewareEntries) {
				if (!middleware.addBindings) continue;

				containerModule = await middleware.addBindings(
					containerModule,
					{
						...ctx,
						middlewareConfig: extra
					},
					middlewareArgs
				);
			}

			let containerFactory = createContainerFactory(containerModule);
			for (const { middleware, args: middlewareArgs } of middlewareEntries) {
				if (!middleware.bindInstances) continue;

				containerFactory = await middleware.bindInstances(
					containerFactory,
					{
						...ctx,
						middlewareConfig: extra
					},
					middlewareArgs
				);
			}

			const rawArgs = pick(allArgs, Object.keys(argsValidator ?? {}));

			let parsedArgs: any = rawArgs;
			if (args) {
				switch (validator) {
					case "zod": {
						const zodValidator = args instanceof zCore.$ZodType ? args : z.object(args);
						const parsed = await z.safeParseAsync(zodValidator, rawArgs);
						if (!parsed.success) {
							throw new ConvexError({
								ZodError: JSON.parse(JSON.stringify(parsed.error.issues, null, 2)) as Value[]
							});
						}
						parsedArgs = parsed.data;
						break;
					}
				}
			}

			let container;
			try {
				container = containerFactory
					.bindInstance(genericCtxId, ctx)
					.bindInstance(genericArgsId, parsedArgs)
					.toContainer();
			} catch (e) {
				throw new ServerConfigurationError({
					message: "Failed to create Haywire container",
					cause: `${e}`
				});
			}

			const middlewareWithDeps = await Promise.all(
				middlewareEntries.map(async (entry) => {
					const dependencies = !entry.middleware.dependencyIds
						? null
						: await resolveDependencies(container, entry.middleware.dependencyIds);
					return {
						...entry,
						dependencies
					};
				})
			);

			const handlerDependencies = await resolveDependencies(container, params.dependencyIds);

			for (const { middleware, dependencies, args: middlewareArgs } of middlewareWithDeps) {
				if (!middleware.handler) continue;

				const handlerCtx = {
					...ctx,
					middlewareConfig: extra
				};

				const handlerArgs: any[] = [];
				if (!isObjectEmpty(middlewareArgs)) {
					handlerArgs.push(middlewareArgs);
				}
				if (dependencies) {
					handlerArgs.push(...dependencies);
				}

				await middleware.handler(handlerCtx, ...handlerArgs);
			}

			const ret = await params.handler(...handlerDependencies);

			let result = ret;
			if (returns) {
				switch (validator) {
					case "zod": {
						const zodValidator = returns instanceof zCore.$ZodType ? returns : z.object(returns);
						// We don't catch the error here. It's a developer error and we
						// don't want to risk exposing the unexpected value to the client.
						result = await z.parseAsync(zodValidator, ret === undefined ? null : ret);
						break;
					}
				}
			}

			return result;
		}
	}) as Registration<Type, Visibility, Args, Output>;
}
