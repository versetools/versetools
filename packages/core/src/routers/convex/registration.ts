import { pick } from "convex-helpers";
import type { Registration } from "convex-helpers/server/customFunctions";
import { zodOutputToConvex, zodToConvexFields } from "convex-helpers/server/zod4";
import { addFieldsToValidator } from "convex-helpers/validators";
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
import { type GenericHaywireId } from "haywire";
import * as z from "zod/v4";
import * as zCore from "zod/v4/core";

import type { GenericHaywireFactory } from "../../haywire-types";
import type { GenericCtx } from "../../helpers";
import type { Class } from "../../utility-types";
import { genericArgsId, genericCtxId } from "./ids";
import type { Middleware, RouteBuilderOptions, ZodFields } from "./types";
import { ServerConfigurationError } from "../../errors";

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
	functionType: FunctionType;
	visibility: FunctionVisibility;
	dependencyIds: readonly GenericHaywireId[];
	middlewarePipeline: Middleware<any, any, any, any, any>[];
	handler: (...args: any) => any;
	options: RouteBuilderOptions<any>;
	factory: GenericHaywireFactory;
};

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

	for (const middleware of params.middlewarePipeline) {
		if (!middleware.args) continue;

		if (!argsValidator) {
			argsValidator = middleware.args;
			continue;
		}

		argsValidator = addFieldsToValidator(
			argsValidator as VObject<any, any, any, string>,
			middleware.args
		);
	}

	if (!args && skipConvexValidation && argsValidator) {
		throw new Error(
			"If you're using middleware with arguments, you cannot skip convex validation."
		);
	}

	return builder({
		args: argsValidator,
		returns: returnsValidator,
		handler: async (ctx: any, allArgs: any) => {
			let factory = params.factory;
			for (const middleware of params.middlewarePipeline) {
				factory = middleware.handler(
					factory,
					ctx,
					pick(allArgs, Object.keys(middleware.args ?? {})),
					extra
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

			factory = factory.register(genericCtxId, ctx).register(genericArgsId, parsedArgs);

			let container;
			try {
				container = factory.toContainer();
			} catch (e) {
				throw new ServerConfigurationError({
					message: "Failed to create container",
					cause: `${e}`
				});
			}

			const handlerDependencies = await Promise.all(
				params.dependencyIds.map(async (id) => {
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
