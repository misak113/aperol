
import { createStore, Store, Middleware, Dispatch, Action } from 'redux';
import IPromiseAction from './IPromiseAction';
import ISaga from './ISaga';
import IUpdaterYield from './IUpdaterYield';
import ObservableSubscribed from './ObservableSubscribed';

async function update(
	subscriptions: Subscription[],
	iterator: Iterator<IUpdaterYield> | AsyncIterator<IUpdaterYield>,
	dispatch: Dispatch<any>,
	sourceAction: Action
) {
	let nextResult;
	do {
		let item: IteratorResult<IUpdaterYield> = await iterator.next(nextResult);
		nextResult = undefined;
		if (item.done) {
			break;
		} else
		if (isPromiseIteration(item.value)) {
			const promiseResult = await item.value;
			if (isObservableIteration(promiseResult)) {
				await handleObservable(dispatch, promiseResult, subscriptions, sourceAction);
			} else
			if (isActionIteration(promiseResult)) {
				await handleAction(dispatch, promiseResult);
			} else {
				nextResult = promiseResult;
			}
		} else
		if (isObservableIteration(item.value)) {
			await handleObservable(dispatch, item.value, subscriptions, sourceAction);
		} else
		if (isActionIteration(item.value)) {
			await handleAction(dispatch, item.value);
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

function isPromiseIteration(value: IUpdaterYield): value is Promise<any> {
	return value instanceof Promise;
}

function isObservableIteration(value: IUpdaterYield): value is Observable<any, Error> {
	return value instanceof Observable;
}

function isActionIteration(value: IUpdaterYield): value is Action {
	return typeof value === 'object' && typeof (value as Action).type !== 'undefined';
}

async function handleObservable(
	dispatch: Dispatch<any>,
	observable: Observable<any, Error>,
	subscriptions: Subscription[],
	sourceAction: Action,
) {
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
}

async function handleAction(dispatch: Dispatch<any>, action: Action) {
	const promiseAction = dispatch(action) as IPromiseAction;
	if (promiseAction.__promise instanceof Promise) {
		await promiseAction.__promise;
	}
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
