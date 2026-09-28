import convex from "@convex-dev/eslint-plugin";
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";
import svelte from "eslint-plugin-svelte";
import zod from "eslint-plugin-zod";
import globals from "globals";
import ts from "typescript-eslint";
import importX from "eslint-plugin-import-x";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";

import webSvelteConfigJs from "./apps/web/svelte.config.js";
import docsSvelteConfigJs from "./apps/docs/svelte.config.js";

const svelteConfig = defineConfig({
	languageOptions: {
		globals: {
			...globals.browser,
			...globals.node,
			App: "readonly"
		},
		parserOptions: {
			extraFileExtensions: [".svelte"],
			parser: ts.parser
		}
	}
});

export default defineConfig(
	globalIgnores([
		"syncpack.config.ts",
		"eslint.config.js",
		"**/svelte.config.js",
		"**/vite.config.ts",
		"**/vitest.config.ts",
		"**/.svelte-kit/",
		"**/build/",
		"**/dist/",
		"**/_generated/",
		"apps/sc-data-extractor/index.d.ts",
		"apps/sc-data-extractor/index.js"
	]),
	js.configs.recommended,
	ts.configs.recommended,
	importX.flatConfigs.recommended,
	importX.flatConfigs.typescript,
	zod.configs.recommended,
	convex.configs.recommended,
	prettier,

	{
		name: "ts",
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			}
		},
		settings: {
			"import-x/resolver-next": [
				createTypeScriptImportResolver({
					project: ["apps/*/tsconfig.json", "packages/*/tsconfig.json", ".pulumi/tsconfig.json"]
				})
			]
		}
	},

	{
		name: "globals",
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},

	{
		name: "global/rules",
		rules: {
			"no-useless-assignment": "off",
			"import-x/no-duplicates": "off",
			"import-x/no-unresolved": [
				"error",
				{
					ignore: ["^\\$app/.+", "^\\$env/.+", "^virtual:.+"]
				}
			],
			"import-x/order": [
				"warn",
				{
					groups: ["builtin", "external", "internal", ["sibling", "parent"], "index"],
					alphabetize: {
						order: "asc",
						caseInsensitive: true
					},
					"newlines-between": "always",
					pathGroups: [
						{
							pattern: "\$**",
							group: "internal"
						}
					]
				}
			],
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_"
				}
			],
			"@typescript-eslint/no-namespace": "off",
			"@typescript-eslint/no-empty-object-type": "off"
		}
	},

	{
		name: "svelte/rules",
		files: ["**/*.{svelte,svelte.ts}"],
		extends: [...svelte.configs.recommended, ...svelte.configs.prettier, svelteConfig],
		languageOptions: {
			parserOptions: {
				// Extremely slow linting when set to true, see: https://github.com/sveltejs/eslint-plugin-svelte/issues/1084
				projectService: false
			}
		},
		rules: {
			"no-undef": "off",
			"svelte/no-navigation-without-resolve": [
				"error",
				{
					ignoreLinks: true
				}
			],
			"svelte/require-store-reactive-access": "off"
		}
	},

	{
		name: "convex/rules",
		files: ["./apps/convex/**/*.ts"],
		rules: {
			// Disabled due to performance issues, only uncomment to check for cycles
			// "import-x/no-cycle": "error"
		}
	},

	{
		extends: svelteConfig,
		name: "web-app",
		files: ["./apps/web/**/*.{js,ts,svelte,svelte.ts}"],
		languageOptions: {
			parserOptions: {
				svelteConfig: webSvelteConfigJs
			}
		}
	},
	{
		extends: svelteConfig,
		name: "docs-app",
		files: ["./apps/docs/**/*.{js,ts,svelte,svelte.ts}"],
		languageOptions: {
			parserOptions: {
				svelteConfig: docsSvelteConfigJs
			}
		}
	}
);
