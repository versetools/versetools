import "eslint-import-resolver-typescript";

import convex from "@convex-dev/eslint-plugin";
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import svelte from "eslint-plugin-svelte";
import zod from "eslint-plugin-zod";
import globals from "globals";
import tseslint from "typescript-eslint";

import svelteConfig from "./apps/web/svelte.config.js";

const convexApp = defineConfig(
	{
		name: "convex/rules",
		files: ["./apps/convex/**/*.ts"],
		rules: {
			// Disabled due to performance issues, only uncomment to check for cycles
			// "import/no-cycle": "error"
		}
	}
);

const webApp = defineConfig({
	name: "web",
	files: ["./apps/web/**/*.{js,ts,svelte,svelte.ts}"],
	languageOptions: {
		globals: {
			...globals.browser,
			...globals.node,
			App: "readonly"
		},
		parserOptions: {
			extraFileExtensions: [".svelte"],
			parser: tseslint.parser,
			svelteConfig
		}
	}
});

const sveltePackages = defineConfig({
	name: "svelte-packages",
	files: ["./packages/convex-client/src/svelte/**/*.{ts,svelte,svelte.ts}"],
	languageOptions: {
		globals: {
			...globals.browser,
			...globals.node,
			App: "readonly"
		},
		parserOptions: {
			extraFileExtensions: [".svelte"],
			parser: tseslint.parser,
			svelteConfig
		}
	}
});

export default defineConfig(
	globalIgnores([
		".syncpackrc.ts",
		"eslint.config.js",
		"**/svelte.config.js",
		"**/vite.config.ts",
		"**/.svelte-kit/",
		"**/build/",
		"**/dist/",
		"**/_generated/"
	]),
	js.configs.recommended,
	...tseslint.configs.recommended,
	zod.configs.recommended,
	importPlugin.flatConfigs.recommended,
	...convex.configs.recommended,
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
			"import/parsers": {
				"@typescript-eslint/parser": [".ts"]
			},
			"import/resolver": {
				typescript: {
					projectService: true,
					tsconfigRootDir: import.meta.dirname
				}
			}
		}
	},
	{
		name: "globals",
		languageOptions: {
			globals: {
				...globals.browser
			}
		}
	},
	{
		name: "globals/node",
		files: ["./packages/observability/**/*.ts"],
		languageOptions: {
			globals: {
				...globals.node
			}
		}
	},
	{
		name: "global/rules",
		rules: {
			"import/no-unresolved": [
				"error",
				{
					ignore: ["^\\$app/.+", "^\\$env/.+"]
				}
			],
			"import/no-duplicates": "off",
			"import/order": [
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
						},
						{
							pattern: "$env/**",
							group: "internal"
						},
						{
							pattern: "$app/**",
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
		extends: [...svelte.configs.recommended, ...svelte.configs.prettier],
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

	sveltePackages,
	convexApp,
	webApp
);
