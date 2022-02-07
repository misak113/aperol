
export interface IProfilerOptions {
	thresholdMs: number;
}

export type IProfiler = ReturnType<typeof startProfiler>;

export function startProfiler(options: IProfilerOptions) {
	let lastTimeViolationMs: number | null = null;
	let stopped = false;

	const profiler = {
		popLastTimeViolation() {
			const timeViolationMs = lastTimeViolationMs;
			lastTimeViolationMs = null;
			return timeViolationMs;
		},
		stop() {
			stopped = true;
		},
	};

	let lastTickTimestamp = new Date().valueOf();

	function profileNextTick() {
		setImmediate(() => {
			const tickTimeMs = new Date().valueOf() - lastTickTimestamp;
			lastTickTimestamp = new Date().valueOf();
			if (tickTimeMs >= options.thresholdMs) {
				lastTimeViolationMs = tickTimeMs;
			}
			if (!stopped) {
				profileNextTick();
			}
		});
	}

	profileNextTick();

	return profiler;
}
