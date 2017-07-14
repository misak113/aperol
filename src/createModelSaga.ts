
import { createStore, Store, Middleware, Dispatch, Action } from 'redux';
import IPromiseAction from './IPromiseAction';
import ISaga from './ISaga';
import IUpdaterYield from './IUpdaterYield';
import ObservableSubscribed from './ObservableSubscribed';

async function update(
	subscriptions: Subscription[],
	iterator: Iterator<IUpdaterYield>,
	dispatch: Dispatch<any>,
	sourceAction: Action
) {
	let nextResult;
	do {
		let item: IteratorResult<IUpdaterYield> = iterator.next(nextResult);
		nextResult = undefined;
		if (item.done) {
			break;
		} else
		if (item.value instanceof Promise) {
			nextResult = await item.value;
		} else
		if (item.value instanceof Observable) {
			const observable = item.value;
			const subscription = observable.subscribe(function (observableIterator: Iterator<IUpdaterYield>) {
				update(subscriptions, observableIterator, dispatch, sourceAction);
			});
			subscriptions.push(subscription);
			const promiseObservableSubscribed = dispatch({
				type: ObservableSubscribed,
				observable,
				subscription,
				sourceAction,
			} as ObservableSubscribed<Action>) as Action as IPromiseAction;
			if (promiseObservableSubscribed.__promise instanceof Promise) {
				await promiseObservableSubscribed.__promise;
			}
		} else
		if (typeof (item.value as Action).type !== 'undefined') {
			const promiseAction = dispatch(item.value) as IPromiseAction;
			if (promiseAction.__promise instanceof Promise) {
				await promiseAction.__promise;
			}
		} else {
			const error = new Error(
				'Updater must yield action or promise. '
				+ JSON.stringify(item.value) + ' given.'
			);
			if (iterator.throw) {
				iterator.throw(error);
			} else {
				throw error;
			}
		}
	} while (true);
}

export default function createModelSaga<TModel>(saga: ISaga<TModel>) {
	const sagaStore = createStore(saga.reducer);
	const subscriptions: Subscription[] = [];
	const middleware: Middleware = (store: Store<any>) => (nextDispatch: Dispatch<any>) => (action: any) => {
		const result = nextDispatch(action);
		sagaStore.dispatch(action);
		const model = sagaStore.getState();
		const iterator = saga.updater(model, action);
		const promise = update(subscriptions, iterator, store.dispatch, action);
		Object.defineProperty(result, '__promise', {
			enumerable: false,
			configurable: false,
			writable: false,
			value: promise
		});
		return result as any;
	};
	const destroy = () => {
		subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
	};
	return {
		middleware,
		destroy
	};
}
