
import { createStore, Store, Middleware, Dispatch, Action } from 'redux';
import { generateUid } from './Helper/hash';
import { extendWithInternalProperty } from './Helper/property';
import ISaga from './ISaga';
import AsyncIteratorStarted from './AsyncIteratorStarted';
import {
	SourceAction,
	sourceActionProperty,
	AsyncIteratorAction,
	asyncIteratorProperty,
	PromiseAction,
	promiseProperty,
} from './internalActions';

async function update(
	asyncIterator: AsyncIterableIterator<Action>,
	dispatch: Dispatch<any>,
) {
	const promises = [];
	for await (let value of asyncIterator) {
		if (typeof value === 'object') {
			const promiseAction = dispatch(value) as PromiseAction & Action;
			promises.push(promiseAction.__promise);
		} else {
			const error = new Error(
				'Updater must yield action. ' + JSON.stringify(value) + ' given.'
			);
			if (asyncIterator.throw) {
				asyncIterator.throw(error);
			} else {
				throw error;
			}
		}
	}
	await Promise.all(promises);
}

export default function createModelSaga<TModel>(saga: ISaga<TModel>) {
	const sagaStore = createStore(saga.reducer);
	const asyncIterators: { [asyncIteratorUid: string]: AsyncIterableIterator<Action> } = {};
	const middleware: Middleware = (store: Store<any>) => (nextDispatch: Dispatch<any>) => <TAction extends Action>(action: TAction) => {
		const result = nextDispatch(action);
		sagaStore.dispatch(action);
		const model = sagaStore.getState();
		const asyncIterator = saga.updater(model, action);
		const asyncIteratorUid = generateUid();
		asyncIterators[asyncIteratorUid] = asyncIterator;
		const baseDispatch = <A extends Action>(nextAction: A) => {
			extendWithInternalProperty(nextAction, sourceActionProperty, action);
			return store.dispatch(nextAction);
		};
		const promise = update(asyncIterator, baseDispatch)
			.then(() => {
				delete asyncIterators[asyncIteratorUid];
			});
		if (action.type !== AsyncIteratorStarted) {
			baseDispatch({
				type: AsyncIteratorStarted,
				asyncIterator,
				promise,
				sourceAction: action,
			} as AsyncIteratorStarted<Action>);
		}
		extendWithInternalProperty(result, promiseProperty, promise);
		extendWithInternalProperty(result, asyncIteratorProperty, asyncIterator);
		return result;
	};
	const destroy = () => {
		for (let asyncIteratorUid in asyncIterators) {
			const asyncIterator = asyncIterators[asyncIteratorUid];
			delete asyncIterators[asyncIteratorUid];
			if (asyncIterator.return) {
				asyncIterator.return();
			}
		}
	};
	return {
		middleware,
		dispatch<TAction extends Action>(action: TAction): TAction & PromiseAction & SourceAction & AsyncIteratorAction {
			return middleware({
				dispatch: ((a: Action) => this.dispatch(a) as any),
				getState: () => null,
			})(((a: Action) => a) as Dispatch<null>)(action) as TAction & PromiseAction & SourceAction & AsyncIteratorAction;
		},
		getModel: () => sagaStore.getState(),
		destroy,
	};
}
