
import { combineReducers, ReducersMapObject } from 'redux';
import ISaga from './ISaga';
import { Action } from 'redux';
import IUpdaterYield from './IUpdaterYield';

export interface ISagasMapObject {
	[key: string]: ISaga<any>;
}

export interface ICombinedModel {
	[key: string]: any;
}

export default function combineSagas<TModel extends ICombinedModel>(
	sagas: ISagasMapObject
): ISaga<TModel> {
	const sagaKeys = Object.keys(sagas);
	const reducer = combineReducers<TModel>(sagaKeys.reduce<ReducersMapObject>(
		(reducers: ReducersMapObject, key: string) => {
			const saga = sagas[key];
			reducers[key] = saga.reducer;
			return reducers;
		},
		{}
	));
	const updater = async function* (model: TModel, action: Action) {

		const invoke = async function* (key: string) {
			const saga = sagas[key];
			const iterator = saga.updater(model[key], action);
			let nextResult;
			do {
				let item: IteratorResult<IUpdaterYield> = await iterator.next(nextResult);
				if (item.done) {
					break;
				}
				nextResult = yield item.value;
			} while (true);
		};

		const promises: Promise<any[]>[] = [];
		const results: any[] = [];
		const errors: Error[] = [];
		for (const sagaKey of sagaKeys) {
			const generator = invoke(sagaKey);
			const promise = (async function () {
				const values: any[] = [];
				let nextResult;
				do {
					let item: IteratorResult<IUpdaterYield> = await generator.next(nextResult);
					if (item.done) {
						break;
					}
					nextResult = item.value;
					values.push(item.value);
				} while (true);
				return values;
			})();
			promises.push(promise);
			promise.then(
				(value: any) => {
					results.push(value);
					promises.splice(promises.indexOf(promise), 1);
				},
				(error: Error) => {
					errors.push(error);
					promises.splice(promises.indexOf(promise), 1);
				},
			);
		}
		while (promises.length > 0) {
			await Promise.race(promises);
			while (results.length > 0) {
				yield* results.shift();
			}
			while (errors.length > 0) {
				throw errors.shift();
			}
		}
	};
	return {
		reducer,
		updater,
	};
}
