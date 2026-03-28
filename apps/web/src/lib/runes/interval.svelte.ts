export function useInterval<T>(getValue: () => T, delay: number) {
	let value = $state($state.snapshot(getValue()) as T);

	$effect(() => {
		const interval = setInterval(() => {
			value = getValue();
		}, delay);

		return () => {
			clearInterval(interval);
		};
	});

	return {
		get value() {
			return value;
		}
	};
}
