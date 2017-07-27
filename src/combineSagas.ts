
import { combineReducers, ReducersMapObject } from 'redux';
import ISaga from './ISaga';
import { Action } from 'redux';

export type ISagasMapObject<
	TModel extends { [ModelKey in TModelKey]: any },
	TModelKey extends keyof TModel
> = {
	[ModelKey in TModelKey]: ISaga<TModel[ModelKey]>;
};

export interface ICombinedModel {
	[key: string]: any;
}

export default function combineSagas<TModel extends ICombinedModel>(
	sagas: ISagasMapObject<TModel, keyof TModel>
): ISaga<TModel> {
	const sagaKeys: (keyof TModel)[] = Object.keys(sagas);
	const reducer = combineReducers<TModel>(sagaKeys.reduce<ReducersMapObject>(
		(reducers: ReducersMapObject, key: string) => {
			const saga = sagas[key];
			reducers[key] = saga.reducer;
			return reducers;
		},
		{}
	));
	const updater = async function* (model: TModel, action: Action) {
		for (let key of sagaKeys) {
			yield* sagas[key].updater(model[key], action);
		}
	};
	return {
		reducer,
		updater,
	};
}
