import { Action } from "redux";
import { ISaga } from ".";
import { IUpdaterContext } from "./createModelSaga";

const OriginalPromise = Promise;

type OnWarning = (message: string, sagaNames: string[], action: Action) => void;

export interface IProfilerOptions {
	thresholdMs: number;
	onWarning?: OnWarning;
}

type UnknownSaga = ISaga<unknown, unknown, unknown>;

export type IProfiler = ReturnType<typeof startProfiler>;
export type IViolation = {
	timeMs: number;
	stack: string | null;
	sagas: UnknownSaga[];
};

export function startProfiler(options: IProfilerOptions, updaterContext: IUpdaterContext) {
	const onWarning: OnWarning = options.onWarning ?? console.warn.bind(console);
	let lastViolation: IViolation | null = null;
	let stopped = false;

	const profiler = {
		stop() {
			global.Promise = OriginalPromise;
			stopped = true;
		},
		async handleProfilerViolation(action: Action) {
			if (lastViolation) {
				const violation = lastViolation;
				lastViolation = null;
				const combinedSagaNames = Object.keys(updaterContext.combinedSagas ?? {});
				const combinedSagas = Object.values(updaterContext.combinedSagas ?? {});
				const indexes = combinedSagas.reduce(
					(ixs: number[], currentSaga: UnknownSaga, ix: number) => violation.sagas.includes(currentSaga) ? [...ixs, ix] : ixs,
					[],
				);
				onWarning(
					`The threshold of profiler has been reached: time=${violation.timeMs}ms, stack=\n${violation.stack}`,
					indexes.map((index: number) => combinedSagaNames[index]) ?? [],
					action,
				);
			}
		},
	};

	class ProfiledPromise<T> extends OriginalPromise<T> {
		constructor(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) {
			const error = new Error(`The threshold of profiler has been reached`);
			super((resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => {
				if (lastViolation) {
					lastViolation.stack = `${error.stack ?? ''}\n${lastViolation.stack ?? ''}`;
					lastViolation.sagas = [...lastViolation.sagas, ...updaterContext.lastSagas];
				}
				return executor(resolve, reject);
			});
		}
	}
	global.Promise = ProfiledPromise;

	let lastTickTimestamp = new Date().valueOf();

	function profileNextTick() {
		setImmediate(() => {
			const tickTimeMs = new Date().valueOf() - lastTickTimestamp;
			lastTickTimestamp = new Date().valueOf();
			if (tickTimeMs >= options.thresholdMs) {
				lastViolation = {
					timeMs: tickTimeMs,
					stack: null,
					sagas: [],
				};
			}
			if (!stopped) {
				profileNextTick();
			}
		});
	}

	profileNextTick();

	return profiler;
}
