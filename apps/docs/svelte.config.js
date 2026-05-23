import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/**
 * @type {import('@sveltejs/kit').Config}
 */
const config = {
	extensions: [".svelte", ".md"],
	preprocess: [vitePreprocess()],
	kit: {
		adapter: adapter({
			pages: "build",
			precompress: true
		}),
		paths: {
			relative: false
		}
	}
};

export default config;
