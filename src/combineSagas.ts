
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
		const values = await Promise.all(sagaKeys.map(async function* (key: string) {
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
		}));
		for (const item of values) {
			yield* item;
		}
	};
	return {
		reducer,
		updater,
	};
}
