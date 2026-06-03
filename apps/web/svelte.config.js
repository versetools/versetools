import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [vitePreprocess()],
	extensions: [".svelte"],

	kit: {
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter({
			out: "build",
			precompress: true
		}),
		alias: {
			$server: "src/lib/server",
			$convex: "../convex/src",
			$data: "src/data",
			$routes: "src/routes",
			$config: "src/config",
			$permissions: "../../packages/permissions/src"
		}
	}
};

export default config;
