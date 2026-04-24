import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import tseslint from "typescript-eslint";
import "eslint-import-resolver-typescript";

export default defineConfig(
	{
		ignores: ["eslint.config.js", "vite.config.ts", ".svelte-kit/", "dist/"]
	},
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs["flat/recommended"],
	prettier,
	...svelte.configs["flat/prettier"],
	importPlugin.flatConfigs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				App: "readonly"
			}
		}
	},
	{
		files: ["**/*.svelte", "**/*.svelte.ts"],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser
			}
		}
	},
	{
		settings: {
			"import/parsers": {
				"@typescript-eslint/parser": [".ts"]
			},
			"import/resolver": {
				typescript: {
					project: import.meta.dirname + "/tsconfig.json"
				},
				node: {
					extensions: [".js", ".jsx", ".ts", ".tsx", ".svelte", ".svelte.ts"]
				}
			}
		}
	},
	{
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
			"svelte/no-navigation-without-resolve": [
				"error",
				{
					ignoreLinks: true
				}
			]
		}
	}
);
