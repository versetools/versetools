import { sveltepress } from "@sveltepress/vite";
import { defineConfig } from "vite";

import remarkCustomHeaderId from "remark-custom-header-id";
import remarkSectionize from "remark-sectionize";

import theme, { siteConfig } from "./theme";

const config = defineConfig({
	plugins: [
		sveltepress({
			theme,
			siteConfig,
			remarkPlugins: [remarkCustomHeaderId, remarkSectionize as any]
		})
	],
	server: {
		port: 5171,
		allowedHosts: ["docs.versetools.com", "host.docker.internal"]
	}
});

export default config;
