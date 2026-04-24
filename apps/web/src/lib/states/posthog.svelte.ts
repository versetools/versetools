import type { Id } from "$convex/_generated/dataModel";
import type { FeatureFlagName } from "$convex/app/apis";
import posthogjs from "posthog-js";

import { browser } from "$app/environment";
import { PUBLIC_POSTHOG_PROXY, PUBLIC_POSTHOG_KEY } from "$env/static/public";

import { consent } from "./consent.svelte";

function isHTMLElement(element: any): element is HTMLElement {
	return element instanceof HTMLElement;
}

function getTrackingLabel(element: HTMLElement) {
	const label = element.dataset.trackingLabel;
	if (!label) return null;

	const category = element.dataset.trackingCategory;

	return category ? `${category}:${label}` : label;
}

function getTrackingData(element: HTMLElement) {
	const data = element.dataset.trackingData;
	if (!data) return null;

	data.split(";").reduce(
		(data, entry) => {
			const [key, value] = entry.split(":");
			return { ...data, [key]: value };
		},
		{} as Record<string, any>
	);
}

function clickEventListener(event: MouseEvent) {
	if (!event.currentTarget || !isHTMLElement(event.currentTarget)) return;

	const label = getTrackingLabel(event.currentTarget);
	if (!label) return;

	posthogjs.capture(`${label}_click`, getTrackingData(event.currentTarget));
}

function track(element: HTMLElement) {
	if (!element.dataset.trackingLabel) return;

	element.removeEventListener("click", clickEventListener);
	element.addEventListener("click", clickEventListener);
}

function createPosthogState() {
	let loaded = $state(false);

	return {
		init() {
			if (browser && !loaded) {
				loaded = true;
				posthogjs.init(PUBLIC_POSTHOG_KEY, {
					api_host: PUBLIC_POSTHOG_PROXY,
					ui_host: "https://eu.i.posthog.com",
					persistence_name: "posthog_user",
					persistence: consent.isEnabled("posthog") ? "localStorage+cookie" : "memory",
					capture_exceptions: true,
					disable_surveys: false
				});
			}

			$effect(() => {
				posthogjs.set_config({
					persistence: consent.isEnabled("posthog") ? "localStorage+cookie" : "memory"
				});
			});

			if (browser) {
				const trackingElements = document.querySelectorAll<HTMLElement>("[data-tracking-label]");
				for (const element of trackingElements) {
					track(element);
				}

				const observer = new MutationObserver((mutations) => {
					for (const mutation of mutations) {
						if (mutation.type === "childList") {
							for (const node of mutation.addedNodes) {
								if (!isHTMLElement(node) || !node.dataset.trackingLabel) continue;
								track(node);
							}
						} else if (
							mutation.type === "attributes" &&
							isHTMLElement(mutation.target) &&
							mutation.attributeName === "data-tracking-label" &&
							!mutation.oldValue
						) {
							track(mutation.target);
						}
					}
				});

				observer.observe(document.body, {
					attributes: true,
					attributeOldValue: true,
					attributeFilter: ["data-tracking-label"],
					childList: true,
					subtree: true
				});
			}
		},
		setUser(id: Id<"user">) {
			if (posthogjs.get_distinct_id() === id) {
				return;
			}
			posthogjs.identify(id);
		},
		isFeatureEnabled(flag: FeatureFlagName, defaultValue = false) {
			if (browser) {
				return posthogjs.isFeatureEnabled(flag) ?? defaultValue;
			}
			return defaultValue;
		},
		useFeatureFlag(flag: FeatureFlagName, defaultValue = false) {
			let state = $state(this.isFeatureEnabled(flag, defaultValue));

			if (browser) {
				posthogjs.onFeatureFlags(() => {
					state = this.isFeatureEnabled(flag);
				});
			}

			return {
				get enabled() {
					return state;
				}
			};
		}
	};
}

export const posthog = createPosthogState();
