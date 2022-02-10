
import { Action } from 'redux';
import { ISagasMapObject } from './combineSagas';
import IUpdaterYield from './IUpdaterYield';

interface ISaga<TModel, TReturn, TNext> {
	reducer(model: TModel, action: Action): TModel;
	updater(model: TModel, action: Action): Iterator<IUpdaterYield, TReturn, TNext> | AsyncIterator<IUpdaterYield, TReturn, TNext>;
	/** @protected only for internal usage when profiling */
	__combinedSagas?: ISagasMapObject;
}
export default ISaga;
