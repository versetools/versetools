export function useDebounce<T>(getValue: () => T, delay: number) {
	const initialValue = $state.snapshot(getValue());
	const currentValue = $derived($state.snapshot(getValue()));

	let debouncedValue = $state(initialValue);
	let timeoutId: NodeJS.Timeout | undefined = undefined;

	$effect(() => {
		clearTimeout(timeoutId);
		const value = currentValue;

		timeoutId = setTimeout(() => {
			debouncedValue = value;
		}, delay);
	});

	return {
		get value() {
			return debouncedValue as T;
		}
	};
}
