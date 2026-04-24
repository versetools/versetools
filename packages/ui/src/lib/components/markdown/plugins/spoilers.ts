import type { PhrasingContent } from "mdast";
import { findAndReplace } from "mdast-util-find-and-replace";
import type { Plugin } from "svelte-exmarkdown";

import Spoiler from "./spoiler.svelte";

declare module "mdast" {
	interface SpoilerData extends Data {
		hName: string;
	}

	interface Spoiler extends Node {
		type: "spoiler";
		children: PhrasingContent[];
		data: SpoilerData;
	}

	interface PhrasingContentMap {
		spoiler: Spoiler;
	}
}

const spoilerRegex = new RegExp("(?:^|\\s)\\|\\|([^|]+)\\|\\|", "gi");

function replaceSpoiler(value: string, text: string): PhrasingContent[] {
	const nodes: PhrasingContent[] = [];

	if (value.indexOf("||") > 0) {
		nodes.push({
			type: "text",
			value: value.slice(0, value.indexOf("||"))
		});
	}

	return [
		...nodes,
		{
			type: "spoiler",
			children: [{ type: "text", value: text }],
			data: {
				hName: "spoiler"
			}
		}
	];
}

export function spoilers(): Plugin {
	return {
		remarkPlugin: () => {
			return (tree) => {
				findAndReplace(tree, [[spoilerRegex, replaceSpoiler]]);
			};
		},
		rehypePlugin: () => {},
		renderer: {
			spoiler: Spoiler
		}
	};
}
