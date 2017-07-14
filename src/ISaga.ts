
import { Action } from 'redux';
import IUpdaterYield from './IUpdaterYield';

interface ISaga<TModel> {
	reducer(model: TModel, action: Action): TModel;
	updater(model: TModel, action: Action): Iterator<IUpdaterYield>;
}
export default ISaga;
