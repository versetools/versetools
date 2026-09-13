const DEFAULT_REACHABILITY_TIMEOUT_MS = 5_000;

export async function assertConvexReachable(
	url: string,
	timeoutMs = DEFAULT_REACHABILITY_TIMEOUT_MS,
	fetcher: typeof fetch = fetch
): Promise<void> {
	try {
		const response = await fetcher(url, {
			method: "HEAD",
			signal: AbortSignal.timeout(timeoutMs)
		});
		if (response.status >= 500) throw new Error(`Convex returned HTTP ${response.status}`);
	} catch (error) {
		throw new Error(`Convex is not reachable at ${url}`, { cause: error });
	}
}
