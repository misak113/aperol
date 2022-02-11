import { createStore, Store, Middleware, Dispatch, Action, AnyAction } from 'redux';
import IPromiseAction from './IPromiseAction';
import ISaga from './ISaga';
import IUpdaterYield from './IUpdaterYield';
import ObservableSubscribed from './ObservableSubscribed';
import ObservableYield from './ObservableYield';
import ActionYield from './ActionYield';
import { IProfiler, IProfilerOptions, startProfiler } from './Profiler/profiler';
import AnyIterator from './AnyIterator';

async function update(
	subscriptions: Subscription[],
	iterator: AnyIterator,
	dispatch: Dispatch<Action>,
	sourceAction: Action,
	profiler: IProfiler | null,
) {
	const tracking = profiler?.track(iterator, sourceAction);
	try {
		return await doUpdate(subscriptions, iterator, dispatch, sourceAction, profiler);
	} finally {
		tracking?.stop();
	}
}

async function doUpdate(
	subscriptions: Subscription[],
	iterator: AnyIterator,
	dispatch: Dispatch<Action>,
	sourceAction: Action,
	profiler: IProfiler | null,
) {
	let nextResult: IUpdaterYield | undefined;
	do {
		let item: IteratorResult<IUpdaterYield> = await iterator.next(nextResult);
		nextResult = undefined;
		if (item.done) {
			break;
		} else
		if (isPromiseIteration(item.value)) {
			const promiseResult: IUpdaterYield = await item.value;
			if (isObservableIteration(promiseResult)) {
				await handleObservable(dispatch, promiseResult.observable, subscriptions, sourceAction, profiler);
			} else
			if (isActionIteration(promiseResult)) {
				await handleAction(dispatch, promiseResult.action);
			} else {
				nextResult = promiseResult;
			}
		} else
		if (isObservableIteration(item.value)) {
			await handleObservable(dispatch, item.value.observable, subscriptions, sourceAction, profiler);
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
	observable: Observable<AnyIterator, Error>,
	subscriptions: Subscription[],
	sourceAction: Action,
	profiler: IProfiler | null,
) {
	const subscription = observable.subscribe(function (observableIterator: AnyIterator) {
		update(subscriptions, observableIterator, dispatch, sourceAction, profiler);
	});
	subscriptions.push(subscription);
	const promiseObservableSubscribed = dispatch({
		type: ObservableSubscribed,
		observable,
		subscription,
		sourceAction,
	} as ObservableSubscribed<Action>) as Action as IPromiseAction;
	if (promiseObservableSubscribed?.__promise instanceof Promise) {
		await promiseObservableSubscribed.__promise;
	}
}

async function handleAction(dispatch: Dispatch<Action>, action: Action) {
	const promiseAction = dispatch(action) as IPromiseAction;
	if (promiseAction?.__promise instanceof Promise) {
		await promiseAction.__promise;
	}
}

function startGarbageCollector(subscriptions: Subscription[]) {
	const intervalHandler = setInterval(
		() => {
			for (let index in subscriptions) {
				if (subscriptions[index].closed) {
					subscriptions.splice(parseInt(index), 1);
				}
			}
		},
		10e3,
	);
	return {
		stop() {
			clearInterval(intervalHandler);
		},
	};
}

export interface IOptions {
	profiler?: IProfilerOptions;
}

export default function createModelSaga<TModel>(saga: ISaga<TModel, unknown, unknown>, options?: IOptions) {
	const sagaStore = createStore(saga.reducer);
	const subscriptions: Subscription[] = [];
	const profiler = options?.profiler ? startProfiler(options.profiler) : null;
	const middleware: Middleware = (store: Store<any>) => (nextDispatch: Dispatch<AnyAction>) => (action: Action) => {
		const result = nextDispatch(action);
		sagaStore.dispatch(action);
		const model = sagaStore.getState();
		const iterator = saga.updater(model, action);
		const promise = update(subscriptions, iterator, store.dispatch, action, profiler);
		Object.defineProperty(result, '__promise', {
			enumerable: false,
			configurable: false,
			writable: false,
			value: promise
		});
		return result as any;
	};
	const garbageCollector = startGarbageCollector(subscriptions);
	const destroy = () => {
		garbageCollector.stop();
		subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
	};
	return {
		middleware,
		destroy
	};
}
