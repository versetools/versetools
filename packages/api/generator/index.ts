import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { RecordKeyValidatorJSON, ValidatorJSON } from "convex/values";
import * as prettier from "prettier";

type Visibility = { kind: "public" } | { kind: "internal" };

type FunctionType = "Action" | "Mutation" | "Query" | "HttpAction";

type FunctionSpec = {
	url: string;
	functions: AnalyzedFunction[];
};

type AnalyzedFunction = {
	identifier: string;
	functionType: FunctionType;
	visibility: Visibility;
	args: ValidatorJSON | null;
	returns: ValidatorJSON | null;
};

type FunctionNode = {
	function: AnalyzedFunction;
	functionName: string;
	path: string;
};

type FunctionFilter = (node: FunctionNode) => boolean;

function getFunctionSpec(prod?: boolean, filePath?: string) {
	if (filePath && prod) {
		console.error(`To use the prod flag, you can't provide a file path`);
		process.exit(1);
	}
	let content: string;
	if (filePath && !fs.existsSync(filePath)) {
		console.error(`File ${filePath} not found`);
		process.exit(1);
	}
	if (filePath) {
		content = fs.readFileSync(filePath, "utf-8");
	} else {
		const tempFile = path.join(os.tmpdir(), `function-spec-${Date.now()}.json`);

		try {
			const outputFd = fs.openSync(tempFile, "w");
			const flags = prod ? ["--prod"] : [];
			const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
			const extraOpts = process.platform === "win32" ? { shell: true } : {};
			const result = spawnSync(npxCmd, ["convex", "function-spec", ...flags], {
				stdio: ["inherit", outputFd, "pipe"],
				encoding: "utf-8",
				...extraOpts
			});

			fs.closeSync(outputFd);

			if (result.status !== 0) {
				throw new Error(result.stderr || "Failed without error message");
			}

			content = fs.readFileSync(tempFile, "utf-8");
		} catch (e) {
			if (e instanceof Error) {
				console.error(e.message);
			}
			console.error(
				"\nError retrieving function spec from your Convex deployment. " +
					"Confirm that you \nare running this command from within a Convex project.\n"
			);
			throw e;
		} finally {
			try {
				fs.unlinkSync(tempFile);
			} catch (error) {
				console.warn(
					`Warning: Failed to delete temporary file ${tempFile}:`,
					error instanceof Error ? error.message : "Unknown error"
				);
			}
		}
	}

	return content;
}

type CustomTypeResolver = (ctx: {
	node: FunctionNode;
	path: string[];
	validator: ValidatorJSON | null;
}) =>
	| {
			module: string;
			name: string;
			key?: string;
			source?: string | ((validator: ValidatorJSON | null) => string);
	  }
	| {
			module: string;
			name: string;
			key: string;
			source?: string | ((validator: ValidatorJSON | null) => string);
	  }[]
	| null;

type CustomTypeResolvers = {
	args?: CustomTypeResolver;
	returns?: CustomTypeResolver;
};

function resolveCustomTypeSource(
	validator: ValidatorJSON | null,
	selector: { name: string; source?: string | ((validator: ValidatorJSON | null) => string) }
) {
	if (!selector.source) {
		return selector.name;
	}

	return typeof selector.source === "function" ? selector.source(validator) : selector.source;
}

function generateArgsType(
	validator: ValidatorJSON | null,
	node: FunctionNode,
	customTypeResolver?: CustomTypeResolver,
	path: string[] = []
): string {
	const selector = customTypeResolver?.({ node, path, validator });
	if (selector && !Array.isArray(selector) && !selector.key) {
		return resolveCustomTypeSource(validator, selector);
	}

	if (!validator) {
		return "null";
	}

	switch (validator.type) {
		case "null":
			return "null";
		case "number":
			return "number";
		case "bigint":
		case "commitTs":
			return "bigint";
		case "boolean":
			return "boolean";
		case "string":
			return "string";
		case "bytes":
			return "ArrayBuffer";
		case "any":
			return "any";
		case "literal":
			if (typeof validator.value === "string") {
				return `"${validator.value}"` as string;
			} else {
				return validator.value!.toString();
			}
		case "id":
			return `Id<"${validator.tableName}">`;
		case "array":
			if (selector && !Array.isArray(selector) && selector.key === "[]") {
				return `Array<${resolveCustomTypeSource(validator.value, selector)}>`;
			}

			return `Array<${generateArgsType(validator.value, node, customTypeResolver, [...path, "[]"])}>`;
		case "record": {
			const keyType = generateRecordKeyType(validator.keys);
			const valueType = generateArgsType(validator.values.fieldType, node, customTypeResolver, [
				...path
			]);
			return `Record<${keyType}, ${valueType}>`;
		}
		case "object": {
			const selectors = Array.isArray(selector) ? selector : selector ? [selector] : [];
			const members: string[] = Object.entries(validator.value).map(([key, value]) => {
				const memberSelector = selectors.find((s) => s.key === key);

				let type;
				if (memberSelector) {
					type = resolveCustomTypeSource(value.fieldType, memberSelector);
				} else {
					type = generateArgsType(value.fieldType, node, customTypeResolver, [...path, key]);
				}

				return `${key}${value.optional ? "?" : ""}: ${type},`;
			});

			if (members.length === 0) {
				// special case empty object
				return "Record<string, never>";
			}
			return `{ ${members.join("\n")} }`;
		}
		case "union": {
			const members: string[] = validator.value.map((v) =>
				generateArgsType(v, node, customTypeResolver, [...path])
			);
			return members.join(" | ");
		}
		default:
			return "unknown";
	}
}

/**
 * Generates a TypeScript-compatible key type for a record.
 */
function generateRecordKeyType(keys: RecordKeyValidatorJSON): string {
	switch (keys.type) {
		case "string":
			return "string";
		case "id":
			return `Id<"${keys.tableName}">`;
		case "union":
			return keys.value.map(generateRecordKeyType).join(" | ");
		default:
			return "any";
	}
}

function isFunctionNode(node: Record<string, any>): node is FunctionNode {
	return "function" in node && node.function.functionType !== undefined;
}

function generateApiType(node: Record<string, any>, customTypeResolvers?: CustomTypeResolvers) {
	if (isFunctionNode(node)) {
		const fn = node.function;

		const type = (fn.functionType as string).toLowerCase();
		const visibility = fn.visibility.kind;
		const input = generateArgsType(fn.args, node, customTypeResolvers?.args);
		const output = generateArgsType(fn.returns, node, customTypeResolvers?.returns);

		return `FunctionReference<"${type}", "${visibility}", ${input}, ${output}>`;
	}
	const members: string[] = Object.entries(node).map(([key, value]) => {
		return `${key}: ${generateApiType(value, customTypeResolvers)}`;
	});
	return `{ ${members.join("\n")} }`;
}

export function generateApiSpec(
	functionSpec: FunctionSpec,
	includeInternal: boolean,
	filter?: FunctionFilter,
	customTypeResolvers?: CustomTypeResolvers
) {
	if (functionSpec.functions === undefined || functionSpec.url === undefined) {
		console.error(
			"Incorrect function spec provided. Confirm that you have Convex 1.15.0 or greater installed."
		);
		process.exit(1);
	}

	const publicFunctionTree: Record<string, any> = {};
	const internalFunctionTree: Record<string, any> = {};
	for (const fn of functionSpec.functions) {
		// Skip http actions because they go to a different url and we don't have argument/return types
		if (fn.functionType === "HttpAction") {
			continue;
		}
		const [modulePath, functionName] = fn.identifier.split(":");
		const withoutExtension = modulePath!.slice(0, modulePath!.length - 3);

		const leaf = {
			function: fn,
			functionName,
			path: withoutExtension
		} satisfies FunctionNode;

		if (filter && !filter(leaf)) {
			continue;
		}

		const pathParts = withoutExtension!.split("/");
		let treeNode = fn.visibility.kind === "internal" ? internalFunctionTree : publicFunctionTree;
		for (let i = 0; i < pathParts.length; i += 1) {
			const pathPart = pathParts[i]!;
			if (treeNode[pathPart] === undefined) {
				treeNode[pathPart] = {};
			}
			treeNode = treeNode[pathPart];
		}
		treeNode[functionName!] = leaf;
	}

	const customTypeImports: Record<string, Set<string>> = {};

	function wrapCustomTypeResolver(resolver?: CustomTypeResolver): CustomTypeResolver | undefined {
		if (!resolver) return undefined;

		return (...args) => {
			const selectors = resolver!(...args);
			if (!selectors) return null;

			const customTypes = Array.isArray(selectors) ? selectors : [selectors];
			for (const customType of customTypes) {
				if (!customTypeImports[customType.module]) {
					customTypeImports[customType.module] = new Set();
				}
				customTypeImports[customType.module].add(customType.name);
			}

			return selectors;
		};
	}

	const wrappedTypeResolvers = customTypeResolvers
		? {
				args: wrapCustomTypeResolver(customTypeResolvers.args),
				returns: wrapCustomTypeResolver(customTypeResolvers.returns)
			}
		: undefined;

	const apiType = generateApiType(publicFunctionTree, wrappedTypeResolvers);
	const internalApiType = generateApiType(
		includeInternal ? internalFunctionTree : {},
		wrappedTypeResolvers
	);

	let source = `
import { type FunctionReference, anyApi } from "convex/server"
import { type GenericId as Id } from "convex/values"
`;

	for (const [module, typeNames] of Object.entries(customTypeImports)) {
		source += `import type { ${Array.from(typeNames).join(", ")} } from "${module}"\n`;
	}

	source += "\n";
	source += "export const api: PublicApiType = anyApi as unknown as PublicApiType;\n";

	if (includeInternal) {
		source += "export const internal: InternalApiType = anyApi as unknown as InternalApiType;\n";
	}

	source += "\n";
	source += `export type PublicApiType = ${apiType}\n`;

	if (includeInternal) {
		source += `export type InternalApiType = ${internalApiType}\n`;
	}

	return source;
}

type Options = {
	prod?: boolean;
	includeInternal?: boolean;
	inputFile?: string;
	outputFile?: string;
	filter?: FunctionFilter;
	overrideArgsType?: CustomTypeResolver;
	overrideReturnType?: CustomTypeResolver;
};

async function generator(options: Options) {
	const content = getFunctionSpec(options.prod, options.inputFile);
	const baseOutputPath = options.outputFile ?? `convexApi${Date.now().valueOf()}`;
	const outputPath = baseOutputPath.endsWith(".ts") ? baseOutputPath : baseOutputPath + ".ts";

	try {
		const apiSpec = generateApiSpec(
			JSON.parse(content),
			options.includeInternal ?? false,
			options.filter,
			{
				args: options.overrideArgsType,
				returns: options.overrideReturnType
			}
		);
		const formattedSpec = await prettier.format(apiSpec, {
			parser: "typescript"
		});
		fs.writeFileSync(outputPath, formattedSpec, "utf-8");
	} catch (e) {
		console.error("Failed to generate TypeScript API spec: ", e);
		process.exit(1);
	}

	console.log("Wrote API spec to " + outputPath);
}

const typesModule = "@versetools/types";

void generator({
	outputFile: path.resolve(import.meta.dirname, "../src/_generated/api.ts"),
	filter({ function: fn }) {
		if (fn.args?.type === "object" && "secret" in fn.args.value) {
			// Exclude all secret functions
			return false;
		}

		return true;
	},
	overrideArgsType({ node, path }) {
		console.log("Override args", node, path.join("."));

		if (node.path.endsWith("locations") && !path.length) {
			switch (node.functionName) {
				case "findByProperty":
					return [
						{
							module: typesModule,
							name: "LocationPropertyType",
							key: "type"
						},
						{
							module: typesModule,
							name: "LocationAmenity",
							key: "value"
						}
					];
			}
		}

		if (path.at(-1) === "paginationOpts") {
			return {
				module: "convex/server",
				name: "Cursor",
				key: "cursor",
				source(validator) {
					if (validator?.type !== "union") return "Cursor";

					return validator.value
						.map((v) => (v.type === "string" ? "Cursor" : generateArgsType(v, node)))
						.join(" | ");
				}
			};
		}

		return null;
	},
	overrideReturnType({ node, path }) {
		if (node.path.endsWith("locations") && !path.length) {
			switch (node.functionName) {
				case "findByProperty":
					return [
						{
							module: typesModule,
							name: "LocationResponse",
							source: "Array<LocationResponse>",
							key: "page"
						},
						{
							module: "convex/server",
							name: "Cursor",
							key: "continueCursor"
						},
						{
							module: "convex/server",
							name: "Cursor",
							key: "splitCursor",
							source: "Cursor | null"
						}
					];
				case "list":
					return {
						module: typesModule,
						name: "LocationResponse",
						source: "Array<LocationResponse>"
					};
			}
		}

		return null;
	}
});
