
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
	const updater = function* (model: TModel, action: Action) {
		for (let key of sagaKeys) {
			const saga = sagas[key];
			const iterator = saga.updater(model[key], action);
			let nextResult;
			do {
				let item: IteratorResult<IUpdaterYield> = iterator.next(nextResult);
				if (item.done) {
					break;
				}
				nextResult = yield item.value;
			} while (true);
		}
	};
	return {
		reducer,
		updater,
	};
}
