import type { Extension as FromMarkdownExtension } from "mdast-util-from-markdown";
import {
	gfmStrikethroughFromMarkdown,
	gfmStrikethroughToMarkdown
} from "mdast-util-gfm-strikethrough";
import type { Options as ToMarkdownExtension } from "mdast-util-to-markdown";
import { gfmStrikethrough, type Options } from "micromark-extension-gfm-strikethrough";
import type { Extension as MicromarkExtension } from "micromark-util-types";
import type { Plugin } from "svelte-exmarkdown";
import type { Plugin as UnifiedPlugin } from "unified";

declare module "unified" {
	interface Data {
		micromarkExtensions?: MicromarkExtension[];
		fromMarkdownExtensions?: FromMarkdownExtension[];
		toMarkdownExtensions?: ToMarkdownExtension[];
	}
}

export function strikethroughs(options: Options = {}): Plugin {
	return {
		remarkPlugin: function () {
			const data = this.data();

			const micromarkExtensions = data.micromarkExtensions || (data.micromarkExtensions = []);
			const fromMarkdownExtensions =
				data.fromMarkdownExtensions || (data.fromMarkdownExtensions = []);
			const toMarkdownExtensions = data.toMarkdownExtensions || (data.toMarkdownExtensions = []);

			micromarkExtensions.push(gfmStrikethrough(options));
			fromMarkdownExtensions.push(gfmStrikethroughFromMarkdown());
			toMarkdownExtensions.push(gfmStrikethroughToMarkdown());
		} as UnifiedPlugin
	};
}
