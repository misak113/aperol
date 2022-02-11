
import { Action } from 'redux';
import IUpdaterYield from './IUpdaterYield';

interface ISaga<TModel, TReturn, TNext> {
	reducer(model: TModel, action: Action): TModel;
	updater(model: TModel, action: Action): Iterator<IUpdaterYield, TReturn, TNext> | AsyncIterator<IUpdaterYield, TReturn, TNext>;
}
export default ISaga;
