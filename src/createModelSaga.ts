import { createStore, Store, Middleware, Dispatch, Action, AnyAction } from 'redux';
import IPromiseAction from './IPromiseAction';
import ISaga from './ISaga';
import IUpdaterYield from './IUpdaterYield';
import ObservableSubscribed from './ObservableSubscribed';
import ObservableYield from './ObservableYield';
import ActionYield from './ActionYield';

async function update(
	subscriptions: Subscription[],
	iterator: Iterator<IUpdaterYield> | AsyncIterator<IUpdaterYield>,
	dispatch: Dispatch<Action>,
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
				await handleObservable(dispatch, promiseResult.observable, subscriptions, sourceAction);
			} else
			if (isActionIteration(promiseResult)) {
				await handleAction(dispatch, promiseResult.action);
			} else {
				nextResult = promiseResult;
			}
		} else
		if (isObservableIteration(item.value)) {
			await handleObservable(dispatch, item.value.observable, subscriptions, sourceAction);
		} else
		if (isActionIteration(item.value)) {
			await handleAction(dispatch, item.value.action);
		} else {
			nextResult = item.value;
		}
	} while (true);
}

function isPromiseIteration(value: IUpdaterYield): value is Promise<any> {
	return value instanceof Promise;
}

function isObservableIteration(value: IUpdaterYield): value is ObservableYield {
	return value instanceof ObservableYield;
}

function isActionIteration(value: IUpdaterYield): value is ActionYield {
	return value instanceof ActionYield;
}

async function handleObservable(
	dispatch: Dispatch<Action>,
	observable: Observable<Iterator<IUpdaterYield> | AsyncIterator<IUpdaterYield>, Error>,
	subscriptions: Subscription[],
	sourceAction: Action,
) {
	const subscription = observable.subscribe(function (observableIterator: Iterator<IUpdaterYield> | AsyncIterator<IUpdaterYield>) {
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

async function handleAction(dispatch: Dispatch<Action>, action: Action) {
	const promiseAction = dispatch(action) as IPromiseAction;
	if (promiseAction.__promise instanceof Promise) {
		await promiseAction.__promise;
	}
}

export default function createModelSaga<TModel>(saga: ISaga<TModel>) {
	const sagaStore = createStore(saga.reducer);
	const subscriptions: Subscription[] = [];
	const middleware: Middleware = (store: Store<any>) => (nextDispatch: Dispatch<AnyAction>) => (action: Action) => {
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
