import { expect, test, vi } from "vitest";

import { assertConvexReachable } from "../src/convex";

test("accepts a reachable Convex deployment", async () => {
	const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 404 }));

	await expect(
		assertConvexReachable("http://localhost:3210", 100, fetcher)
	).resolves.toBeUndefined();
});

test("rejects a Convex server error", async () => {
	const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 503 }));

	await expect(assertConvexReachable("http://localhost:3210", 100, fetcher)).rejects.toThrow(
		"Convex is not reachable"
	);
});

test("rejects a timed out reachability request", async () => {
	const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
		await new Promise((_resolve, reject) => {
			init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
		});
		throw new Error("unreachable");
	});

	await expect(assertConvexReachable("http://localhost:3210", 1, fetcher)).rejects.toThrow(
		"Convex is not reachable"
	);
});
