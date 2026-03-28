import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type PluginOption } from "vite";

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()] as PluginOption[],
	server: {
		port: 5170,
		allowedHosts: ["local.versetools.com", "host.docker.internal"]
	}
});
