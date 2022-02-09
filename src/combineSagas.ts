
import { combineReducers, ReducersMapObject } from 'redux';
import ISaga from './ISaga';
import { Action } from 'redux';
import IUpdaterYield from './IUpdaterYield';
import { createDeferred, IDeferred } from './Promise/deferred';
import { IUpdaterContext } from './createModelSaga';

export interface ISagasMapObject {
	[key: string]: ISaga<any, any, any>;
}

export interface ICombinedModel {
	[key: string]: any;
}

export default function combineSagas<TModel extends ICombinedModel>(
	sagas: ISagasMapObject
): ISaga<TModel, unknown, unknown> {
	const sagaKeys = Object.keys(sagas);
	const reducer = combineReducers<TModel>(sagaKeys.reduce<ReducersMapObject>(
		(reducers: ReducersMapObject, key: string) => {
			const saga = sagas[key];
			reducers[key] = saga.reducer;
			return reducers;
		},
		{}
	));
	const updater = function (this: IUpdaterContext, model: TModel, action: Action) {
		const updaterContext = this;

		let nextDeferred: IDeferred<void> | undefined = undefined;
		let done = false;
		let errorsQueue: Error[] = [];
		const valuesQueue: unknown[] = [];

		function doYield(value: unknown) {
			valuesQueue.push(value);
			nextDeferred?.resolve();
		}
		function doneYield() {
			done = true;
			nextDeferred?.resolve();
		}
		function errYield(error: Error) {
			errorsQueue.push(error);
			nextDeferred?.resolve();
		}

		const combinedIterator: AsyncIterator<IUpdaterYield> = {
			async next(...args: [] | [undefined]): Promise<IteratorResult<any>> {
				if (errorsQueue.length > 0) {
					throw errorsQueue.shift();
				}
				if (valuesQueue.length > 0) {
					return {
						value: valuesQueue.shift(),
						done: false,
					};
				}
				if (done) {
					return {
						value: undefined,
						done: true,
					};
				}
				if (!nextDeferred) {
					nextDeferred = createDeferred();
				}
				await nextDeferred.promise;
				nextDeferred = undefined;
				return this.next(...args);
			},
		};

		const invoke = async function* (key: string) {
			const saga = sagas[key];
			const iterator = saga.updater(model[key], action);
			let nextResult: undefined;
			do {
				updaterContext.currentSaga = saga;
				let item: IteratorResult<IUpdaterYield> = await iterator.next(nextResult);
				if (item.done) {
					break;
				}
				nextResult = yield item.value;
			} while (true);
		};

		const iterateFns = sagaKeys.map((sagaKey: string) => async () => {
			const generator = invoke(sagaKey);
			let nextResult: any;
			try {
				do {
					let item: IteratorResult<IUpdaterYield> = await generator.next(nextResult);
					if (item.done) {
						break;
					}
					nextResult = item.value;
					doYield(item.value);
				} while (true);
			} catch (error) {
				errYield(error);
				throw error;
			}
		});

		// If profiling, the synchronous processing is required to see better stack trace
		const updatersPromise = updaterContext.profiler
		? iterateFns.reduce((allPromise: Promise<void>, fn: () => Promise<void>) => allPromise.finally(fn), Promise.resolve())
		: Promise.allSettled(iterateFns.map((fn: () => Promise<void>) => fn()));

		updatersPromise.finally(() => doneYield());

		return combinedIterator;
	};
	return {
		reducer,
		updater,
		__combinedSagas: sagas,
	};
}
