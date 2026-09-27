import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
	resolve: {
		alias: {
			$convex: resolve(import.meta.dirname, "src")
		}
	},
	test: {
		environment: "edge-runtime",
		include: ["src/**/*.test.ts"]
	}
});
