import { Action } from "redux";
import AnyIterator from "../AnyIterator";

type OnWarning = (message: string, action: Action) => void;

export interface IProfilerOptions {
	thresholdMs?: number;
	onWarning?: OnWarning;
}

export interface IProfiler {
	track(
		iterator: AnyIterator,
		sourceAction: Action,
	): ITracking;
}

export interface ITracking {
	stop(): void;
}

export function startProfiler(options: IProfilerOptions): IProfiler {
	const onWarning = options.onWarning ?? console.warn.bind(console);
	return {
		track(
			_iterator: AnyIterator,
			sourceAction: Action,
		) {
			const startTime = new Date().valueOf();
			return {
				stop() {
					const time = new Date().valueOf() - startTime;
					if (options.thresholdMs && time >= options.thresholdMs) {
						onWarning(
							`The threshold of profiler has been reached: time=${time}ms`,
							sourceAction,
						);
					}
				},
			};
		},
	};
}
