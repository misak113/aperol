
import { Action } from 'redux';
import { ISagasMapObject } from './combineSagas';
import IUpdaterYield from './IUpdaterYield';

interface ISaga<TModel> {
	reducer(model: TModel, action: Action): TModel;
	updater(model: TModel, action: Action): Iterator<IUpdaterYield> | AsyncIterator<IUpdaterYield>;
	/** @protected only for internal usage when profiling */
	__combinedSagas?: ISagasMapObject;
}
export default ISaga;
