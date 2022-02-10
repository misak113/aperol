
export function wait(timeoutMs: number) {
	return new Promise<void>((resolve: () => void) => setTimeout(resolve, timeoutMs));
}
