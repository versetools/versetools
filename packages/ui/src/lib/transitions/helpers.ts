export function scaleConversion(value: number, from: [number, number], to: [number, number]) {
	const [minA, maxA] = from;
	const [minB, maxB] = to;

	const percentage = (value - minA) / (maxA - minA);
	const scaledValue = percentage * (maxB - minB) + minB;

	return scaledValue;
}
