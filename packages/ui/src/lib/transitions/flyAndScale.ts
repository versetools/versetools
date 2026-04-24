import { styleToString } from "@melt-ui/svelte/internal/helpers";
import { cubicOut } from "svelte/easing";
import { type EasingFunction, type TransitionConfig } from "svelte/transition";

import { scaleConversion } from "./helpers";

export type FlyAndScaleParams = {
	delay?: number;
	duration?: number;
	easing?: EasingFunction;
	x?: number;
	y?: number;
	start?: number;
};

export const flyAndScale = (
	node: Element,
	{ delay = 0, duration = 400, easing = cubicOut, start = 0, x = 0, y = 0 }: FlyAndScaleParams = {}
): TransitionConfig => {
	const style = getComputedStyle(node);
	const transform = style.transform === "none" ? "" : style.transform;

	return {
		duration,
		delay,
		easing,
		css: (t) => {
			const scaledX = scaleConversion(t, [0, 1], [x, 0]);
			const scaledY = scaleConversion(t, [0, 1], [y, 0]);
			const scale = scaleConversion(t, [0, 1], [start, 1]);

			return styleToString({
				transform: `${transform} translate3d(${scaledX}px, ${scaledY}px, 0) scale(${scale})`,
				opacity: t
			});
		}
	};
};
