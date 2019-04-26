
export const wait = (getTick: (tick: () => void) => void) => new Promise(
	(resolve: () => void) => getTick(() => resolve())
);

export async function* repeat(getTick: (tick: () => void) => void): AsyncIterableIterator<void> {
	while (true) {
		await wait(getTick);
		yield;
	}
}
