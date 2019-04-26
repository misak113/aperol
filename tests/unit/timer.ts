
export const wait = (timeout: number) => new Promise(
	(resolve: () => void) => setTimeout(resolve, timeout)
);

export async function* repeat(interval: number): AsyncIterableIterator<void> {
	while (true) {
		await wait(interval);
		yield;
	}
}
