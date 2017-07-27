
import { Action } from 'redux';

interface ISaga<TModel> {
	reducer(model: TModel, action: Action): TModel;
	updater(model: TModel, action: Action): AsyncIterableIterator<Action>;
}
export default ISaga;
