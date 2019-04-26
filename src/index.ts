import ObservableYield from './ObservableYield';
import { Action } from 'redux';
import ActionYield from './ActionYield';
import IUpdaterYield from './IUpdaterYield';

export { default as createModelSaga } from './createModelSaga';
export { default as combineSagas } from './combineSagas';
export { default as ObservableSubscribed } from './ObservableSubscribed';
export { default as IPromiseAction } from './IPromiseAction';
export { default as ISaga } from './ISaga';
export { default as IUpdaterYield } from './IUpdaterYield';
export function observe<TObservable extends Observable<Iterator<IUpdaterYield> | AsyncIterator<IUpdaterYield>, Error>>(
	observable: TObservable,
) {
	return new ObservableYield(observable);
}
export function put<TAction extends Action>(action: TAction) {
	return new ActionYield(action);
}

export function polyfillAsyncIterator() { require('./polyfill/asyncIterator'); }
export function polyfillObservable() { require('./polyfill/observable'); }
