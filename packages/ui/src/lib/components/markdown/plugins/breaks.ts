import remarkBreaks from "remark-breaks";
import type { Plugin } from "svelte-exmarkdown";

export function breaks(): Plugin {
	return {
		remarkPlugin: remarkBreaks
	};
}
