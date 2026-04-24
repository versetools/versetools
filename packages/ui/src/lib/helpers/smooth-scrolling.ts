import type { HTMLAnchorAttributes } from "svelte/elements";

import { pushState } from "$app/navigation";
import { page } from "$app/state";

export function smoothScrollToHash(url: URL) {
	if (!url.hash || url.hash.length < 2) {
		return;
	}

	const id = url.hash.slice(1);
	const element = document.getElementById(id);
	if (element) {
		element.scrollIntoView({ behavior: "smooth", block: "start" });
	}
}

export function smoothScrolling(href?: string | null) {
	const smoothScroll = href ? new URL(href, "http://base").hash.length > 1 : false;
	if (!smoothScroll) {
		return {};
	}

	return {
		"data-smooth-scrolling": "true",
		onclick: (e) => {
			const href = e.currentTarget.href;
			const url = new URL(href);
			if (page.url.pathname !== url.pathname) {
				return;
			}

			e.preventDefault();
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			pushState(href, page.state);
			smoothScrollToHash(url);
		}
	} satisfies HTMLAnchorAttributes;
}
