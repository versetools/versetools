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
import { type Container, type GenericHaywireId } from "haywire";
import * as z from "zod/v4";
import * as zCore from "zod/v4/core";

import type { ConvexRouter } from "./ConvexRouter";
import { genericArgsId, genericCtxId } from "./ids";
import { unsafeMiddlewarePipeline, unsafeRouterContainerFactory } from "./symbols";
import type { RouteBuilderOptions, ZodFields } from "./types";
import { ServerConfigurationError } from "../../errors";
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
	router: ConvexRouter<any>;
	functionType: FunctionType;
	visibility: FunctionVisibility;
	dependencyIds: readonly GenericHaywireId[];
	handler: (...args: any) => any;
	options: RouteBuilderOptions<any>;
};

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

			let containerFactory = params.router[unsafeRouterContainerFactory];
			for (const middleware of middlewarePipeline) {
				if (!middleware.binder) continue;

				containerFactory = await middleware.binder(
					extra,
					containerFactory,
					ctx,
					pick(allArgs, Object.keys(middleware.args ?? {}))
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

			containerFactory = containerFactory
				.bindInstance(genericCtxId, ctx)
				.bindInstance(genericArgsId, parsedArgs);

			let container;
			try {
				container = containerFactory.toContainer();
			} catch (e) {
				throw new ServerConfigurationError({
					message: "Failed to create container",
					cause: `${e}`
				});
			}

			const middlewareDependencies = await Promise.all(
				middlewarePipeline.map((middleware) => {
					if (!middleware.dependencyIds) return null;
					return resolveDependencies(container, middleware.dependencyIds);
				})
			);

			const handlerDependencies = await resolveDependencies(container, params.dependencyIds);

			for (let i = 0; i < middlewarePipeline.length; i++) {
				const middleware = middlewarePipeline[i];
				const dependencies = middlewareDependencies[i];

				if (!middleware.handler) continue;

				if (dependencies) {
					await middleware.handler(extra, ...dependencies);
				} else {
					await middleware.handler(extra, ctx, pick(allArgs, Object.keys(middleware.args ?? {})));
				}
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
