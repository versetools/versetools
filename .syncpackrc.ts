import type { RcFile } from "syncpack";

export default {
	strict: true,
	indent: " ".repeat(4),
	sortFirst: [
		"name",
		"description",
		"version",
		"private",
		"type",
		"author",
		"license",
		"bin",
		"main",
		"types",
		"exports",
		"scripts"
	],
	sortAz: [
		"contributors",
		"peerDependencies",
		"dependencies",
		"devDependencies",
		"keywords",
		"resolutions"
	],
	dependencyGroups: [
		{ dependencies: ["@aws-sdk/**"], aliasName: "aws-sdk-dependencies" },
		{
			dependencies: ["convex"],
			aliasName: "convex-dependency"
		},
		{
			dependencies: ["@sveltejs/kit"],
			aliasName: "sveltejs-kit-dependency"
		},
		{
			dependencies: ["@typescript/native-preview"],
			aliasName: "typescript-native-preview-dependency"
		},
		{
			dependencies: ["@mmailaender/convex-svelte"],
			aliasName: "convex-svelte-dependency"
		}
	],
	versionGroups: [
		{
			label: "Use workspace protocol when developing local packages",
			dependencies: ["$LOCAL"],
			dependencyTypes: ["dev"],
			pinVersion: "workspace:*"
		},
		{ dependencies: ["posthog-js"], pinVersion: "1.292.0" }
	]
} satisfies RcFile;
